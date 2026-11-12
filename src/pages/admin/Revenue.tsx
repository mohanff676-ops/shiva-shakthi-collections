import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
  Layers,
  ShoppingBag,
  ArrowUpRight,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice } from '@/lib/utils';
import { getVisiblePreviewProducts } from '@/data/previewProducts';
import { RecordWhatsAppOrderModal } from '@/components/admin/RecordWhatsAppOrderModal';
import type { Order, Product } from '@/types';
import toast from 'react-hot-toast';

type DateFilterType = 'today' | '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';
type ChartViewType = 'daily' | 'monthly';

/**
 * Timezone-safe local calendar date key (YYYY-MM-DD).
 * Converts UTC timestamps into the viewer's local calendar day to eliminate midnight date boundary offsets.
 */
function getLocalDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * RFC-4180 and spreadsheet injection safe CSV cell formatter.
 * Encloses values in quotes, escapes internal quotes, replaces raw newlines with spaces,
 * and neutralizes spreadsheet formula injection prefixes (=, +, -, @, \t, \r).
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Neutralize spreadsheet formula injection risk (=, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Replace raw newlines with spaces for clean single-row CSV records
  str = str.replace(/\r?\n/g, ' ');

  // Double quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export default function AdminRevenue() {
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('30d');
  const [chartView, setChartView] = useState<ChartViewType>('daily');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Initialize custom dates with reasonable defaults (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setCustomStartDate(getLocalDateKey(start));
    setCustomEndDate(getLocalDateKey(end));
  }, []);

  // Fetch orders and catalog products from Supabase
  const loadData = async () => {
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Fallback demo/preview mode
        const previewProds = getVisiblePreviewProducts();
        setProducts(previewProds as any);
        setOrders([]);
        setLoading(false);
        return;
      }

      // 1. Fetch all products (to match categories, stock, and unit costs)
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!prodErr && prodData) {
        setProducts(prodData as any);
      } else {
        setProducts(getVisiblePreviewProducts() as any);
      }

      // 2. Fetch all orders with order_items
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (orderErr) throw orderErr;
      setOrders((orderData as any) || []);
    } catch (err: any) {
      console.warn('[AdminRevenue] Failed to load orders & products:', err.message);
      toast.error('Unable to fetch live revenue records: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Defensive Authorization Guard
  if (!isAdmin) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-stone-900 mb-2">Access Restricted</h2>
        <p className="text-xs text-stone-600 max-w-sm mb-4">
          Administrative authorization is required to access store financial metrics and export reports.
        </p>
        <Link to="/admin">
          <Button variant="outline" size="sm">Return to Admin Overview</Button>
        </Link>
      </div>
    );
  }

  // Date filtering calculation with local timezone boundary normalization
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const now = new Date();
    let startTime: number | null = null;
    let endTime: number | null = null;

    if (dateFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      startTime = startOfDay.getTime();
      endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    } else if (dateFilter === '7d') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      past7.setHours(0, 0, 0, 0);
      startTime = past7.getTime();
    } else if (dateFilter === '30d') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      past30.setHours(0, 0, 0, 0);
      startTime = past30.getTime();
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      startTime = startOfMonth.getTime();
    } else if (dateFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      startTime = startOfYear.getTime();
    } else if (dateFilter === 'custom') {
      let sDate = customStartDate;
      let eDate = customEndDate;
      // Auto-swap if start is after end
      if (sDate && eDate && sDate > eDate) {
        const temp = sDate;
        sDate = eDate;
        eDate = temp;
      }
      if (sDate) {
        startTime = new Date(`${sDate}T00:00:00`).getTime();
      }
      if (eDate) {
        endTime = new Date(`${eDate}T23:59:59.999`).getTime();
      }
    }

    return orders.filter((o) => {
      const orderTime = new Date(o.created_at).getTime();
      if (startTime !== null && orderTime < startTime) return false;
      if (endTime !== null && orderTime > endTime) return false;
      return true;
    });
  }, [orders, dateFilter, customStartDate, customEndDate]);

  // Financial & Order Metrics Calculations
  const metrics = useMemo(() => {
    // 1. Separate recognized sales from pending inquiries and cancellations
    const recognizedStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    const recognizedOrders = filteredOrders.filter((o) => recognizedStatuses.includes(o.status));
    const pendingInquiryOrders = filteredOrders.filter(
      (o) => o.status === 'inquiry_pending' || (o.status as string) === 'pending'
    );
    const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled');

    // 2. Classify Collected / Settled vs Pending Collection / COD in Transit
    const isOrderCollected = (order: Order): boolean => {
      // Delivered orders are always collected (even COD once delivered)
      if (order.status === 'delivered') return true;

      const notesLower = (order.notes || '').toLowerCase();
      // If COD and not yet delivered, it's pending collection
      if (notesLower.includes('cash on delivery') || notesLower.includes('cod')) {
        return false;
      }
      // If marked pending payment
      if (notesLower.includes('pending payment')) {
        return false;
      }
      // Prepaid methods (UPI, GPay, PhonePe, Card, NEFT, etc.)
      return true;
    };

    const collectedOrders = recognizedOrders.filter(isOrderCollected);
    const pendingCollectionOrders = recognizedOrders.filter((o) => !isOrderCollected(o));

    const collectedRevenuePaise = collectedOrders.reduce((acc, o) => acc + (o.total_paise || 0), 0);
    const pendingCollectionValuePaise = pendingCollectionOrders.reduce((acc, o) => acc + (o.total_paise || 0), 0);

    // 3. Recognized Sales Breakdown (Clean Merchandise vs Net Revenue)
    const grossMerchandiseSalesPaise = recognizedOrders.reduce((acc, o) => acc + (o.subtotal_paise || 0), 0);
    const totalDiscountsPaise = recognizedOrders.reduce((acc, o) => acc + (o.discount_paise || 0), 0);
    const totalShippingPaise = recognizedOrders.reduce((acc, o) => acc + (o.shipping_paise || 0), 0);
    const netMerchandiseSalesPaise = Math.max(0, grossMerchandiseSalesPaise - totalDiscountsPaise);
    const totalRecognizedRevenuePaise = recognizedOrders.reduce((acc, o) => acc + (o.total_paise || 0), 0);

    // 4. Unrecognized / Pending / Cancelled
    const pendingValuePaise = pendingInquiryOrders.reduce((acc, o) => acc + (o.total_paise || 0), 0);
    const cancelledValuePaise = cancelledOrders.reduce((acc, o) => acc + (o.total_paise || 0), 0);

    // 5. Average Order Value (AOV)
    const aovPaise = recognizedOrders.length > 0 ? Math.round(totalRecognizedRevenuePaise / recognizedOrders.length) : 0;

    // 6. Profit estimation (ONLY if real product cost data is present)
    let totalCostPaise = 0;
    let itemsWithCostCount = 0;
    let totalItemsCount = 0;

    recognizedOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          totalItemsCount += item.quantity || 1;
          const prod = products.find((p) => p.id === item.product_id);
          if (prod && typeof prod.cost_price_paise === 'number' && prod.cost_price_paise > 0) {
            totalCostPaise += prod.cost_price_paise * (item.quantity || 1);
            itemsWithCostCount += item.quantity || 1;
          }
        });
      }
    });

    const hasRealCostData = itemsWithCostCount > 0 && totalCostPaise > 0;
    const estimatedProfitPaise = hasRealCostData ? Math.max(0, totalRecognizedRevenuePaise - totalCostPaise) : null;
    const profitMarginPercent = hasRealCostData && totalRecognizedRevenuePaise > 0
      ? Math.round((estimatedProfitPaise! / totalRecognizedRevenuePaise) * 100)
      : null;

    return {
      totalOrdersCount: filteredOrders.length,
      recognizedCount: recognizedOrders.length,
      collectedCount: collectedOrders.length,
      pendingCollectionCount: pendingCollectionOrders.length,
      pendingCount: pendingInquiryOrders.length,
      cancelledCount: cancelledOrders.length,
      grossMerchandiseSalesPaise,
      totalDiscountsPaise,
      totalShippingPaise,
      netMerchandiseSalesPaise,
      totalRecognizedRevenuePaise,
      collectedRevenuePaise,
      pendingCollectionValuePaise,
      pendingValuePaise,
      cancelledValuePaise,
      aovPaise,
      hasRealCostData,
      totalCostPaise,
      estimatedProfitPaise,
      profitMarginPercent,
      recognizedOrders,
      pendingInquiryOrders,
      cancelledOrders,
    };
  }, [filteredOrders, products]);

  // Best-selling products aggregation
  const bestSellingProducts = useMemo(() => {
    const productMap = new Map<string, {
      id: string;
      name: string;
      sku: string;
      unitsSold: number;
      revenuePaise: number;
      ordersCount: Set<string>;
    }>();

    metrics.recognizedOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const key = item.product_name || item.product_id || 'Unknown Item';
          const existing = productMap.get(key) || {
            id: item.product_id || key,
            name: item.product_name,
            sku: item.product_sku || '-',
            unitsSold: 0,
            revenuePaise: 0,
            ordersCount: new Set<string>(),
          };

          existing.unitsSold += item.quantity || 1;
          existing.revenuePaise += item.line_total_paise || (item.unit_price_paise * (item.quantity || 1)) || 0;
          existing.ordersCount.add(order.id);
          productMap.set(key, existing);
        });
      }
    });

    return Array.from(productMap.values())
      .map((p) => ({
        ...p,
        ordersCountNum: p.ordersCount.size,
        avgPricePaise: p.unitsSold > 0 ? Math.round(p.revenuePaise / p.unitsSold) : 0,
        revenueSharePercent: metrics.totalRecognizedRevenuePaise > 0
          ? Math.round((p.revenuePaise / metrics.totalRecognizedRevenuePaise) * 100)
          : 0,
      }))
      .sort((a, b) => b.revenuePaise - a.revenuePaise);
  }, [metrics.recognizedOrders, metrics.totalRecognizedRevenuePaise]);

  // Best-selling categories aggregation
  const bestSellingCategories = useMemo(() => {
    const categoryMap = new Map<string, {
      name: string;
      unitsSold: number;
      revenuePaise: number;
    }>();

    metrics.recognizedOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const prod = products.find((p) => p.id === item.product_id || p.name === item.product_name);
          let catName = 'Jewellery Collections';

          if (prod?.category?.name) {
            catName = prod.category.name;
          } else if (prod?.category_id) {
            catName = prod.category_id.replace(/^cat-/, '').replace(/-/g, ' ').toUpperCase();
          } else {
            const nLower = item.product_name.toLowerCase();
            if (nLower.includes('black beads') || nLower.includes('mangalsutra')) catName = 'Black Beads';
            else if (nLower.includes('bangle') || nLower.includes('kada')) catName = 'Bangles';
            else if (nLower.includes('thali') || nLower.includes('mugappu')) catName = 'Thali Chains';
            else if (nLower.includes('necklace') || nLower.includes('choker')) catName = 'Necklace Sets';
            else if (nLower.includes('haram')) catName = 'Harams';
            else if (nLower.includes('earring') || nLower.includes('jhumka')) catName = 'Earrings';
            else if (nLower.includes('ring')) catName = 'Finger Rings';
            else if (nLower.includes('hair') || nLower.includes('billa')) catName = 'Hair Accessories';
          }

          const existing = categoryMap.get(catName) || {
            name: catName,
            unitsSold: 0,
            revenuePaise: 0,
          };

          existing.unitsSold += item.quantity || 1;
          existing.revenuePaise += item.line_total_paise || (item.unit_price_paise * (item.quantity || 1)) || 0;
          categoryMap.set(catName, existing);
        });
      }
    });

    return Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        sharePercent: metrics.totalRecognizedRevenuePaise > 0
          ? Math.round((c.revenuePaise / metrics.totalRecognizedRevenuePaise) * 100)
          : 0,
      }))
      .sort((a, b) => b.revenuePaise - a.revenuePaise);
  }, [metrics.recognizedOrders, metrics.totalRecognizedRevenuePaise, products]);

  // Inventory Health Summary
  const inventorySummary = useMemo(() => {
    const activeProducts = products.filter((p) => !p.deleted_at);
    const outOfStock = activeProducts.filter((p) => (p.stock_quantity ?? 0) <= 0);
    const lowStock = activeProducts.filter(
      (p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 3)
    );
    const healthyStock = activeProducts.filter(
      (p) => (p.stock_quantity ?? 0) > (p.low_stock_threshold ?? 3)
    );

    return {
      total: activeProducts.length,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      healthyCount: healthyStock.length,
    };
  }, [products]);

  // Revenue Chart Data (Daily or Monthly with Local Timezone Day Keys)
  const chartData = useMemo(() => {
    if (chartView === 'daily') {
      const dayMap = new Map<string, { dateLabel: string; revenuePaise: number; orderCount: number }>();

      // Generate date keys for the last 14 days or filtered period in local timezone
      const daysCount = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : 14;
      const now = new Date();

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const isoDate = getLocalDateKey(d);
        const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        dayMap.set(isoDate, { dateLabel, revenuePaise: 0, orderCount: 0 });
      }

      // Populate recognized sales
      metrics.recognizedOrders.forEach((o) => {
        const localKey = getLocalDateKey(o.created_at);
        if (dayMap.has(localKey)) {
          const entry = dayMap.get(localKey)!;
          entry.revenuePaise += o.total_paise || 0;
          entry.orderCount += 1;
        } else if (dateFilter === 'month' || dateFilter === 'all' || dateFilter === 'custom') {
          const d = new Date(o.created_at);
          const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const entry = dayMap.get(localKey) || { dateLabel, revenuePaise: 0, orderCount: 0 };
          entry.revenuePaise += o.total_paise || 0;
          entry.orderCount += 1;
          dayMap.set(localKey, entry);
        }
      });

      return Array.from(dayMap.entries()).map(([key, val]) => ({
        key,
        label: val.dateLabel,
        revenuePaise: val.revenuePaise,
        orderCount: val.orderCount,
      }));
    } else {
      // Monthly view
      const monthMap = new Map<string, { monthLabel: string; revenuePaise: number; orderCount: number }>();
      const now = new Date();

      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        monthMap.set(key, { monthLabel, revenuePaise: 0, orderCount: 0 });
      }

      metrics.recognizedOrders.forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(key)) {
          const entry = monthMap.get(key)!;
          entry.revenuePaise += o.total_paise || 0;
          entry.orderCount += 1;
        } else {
          const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          const entry = monthMap.get(key) || { monthLabel, revenuePaise: 0, orderCount: 0 };
          entry.revenuePaise += o.total_paise || 0;
          entry.orderCount += 1;
          monthMap.set(key, entry);
        }
      });

      return Array.from(monthMap.entries()).map(([key, val]) => ({
        key,
        label: val.monthLabel,
        revenuePaise: val.revenuePaise,
        orderCount: val.orderCount,
      }));
    }
  }, [chartView, dateFilter, metrics.recognizedOrders]);

  // Max value in chart for bar scaling
  const maxChartRevenuePaise = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.revenuePaise), 0);
    return maxVal > 0 ? maxVal : 10000;
  }, [chartData]);

  // CSV Export: Orders Report (with RFC-4180 escaping and formula injection neutralization)
  const handleExportOrdersCsv = () => {
    if (filteredOrders.length === 0) {
      toast.error('No orders available in this period to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Date (Local)',
      'Customer Name',
      'Phone',
      'Status',
      'Subtotal (INR)',
      'Discount (INR)',
      'Shipping (INR)',
      'Total (INR)',
      'Items Count',
      'Items Summary',
      'Notes & Payment',
    ];

    const rows = filteredOrders.map((o) => {
      const itemsSummary = (o.items || [])
        .map((it) => `${it.product_name} (x${it.quantity})`)
        .join('; ');

      const localDateStr = new Date(o.created_at).toLocaleString('en-IN');

      return [
        escapeCsvCell(o.order_number),
        escapeCsvCell(localDateStr),
        escapeCsvCell(o.customer_name || 'Customer'),
        escapeCsvCell(o.customer_phone || ''),
        escapeCsvCell(o.status),
        escapeCsvCell((o.subtotal_paise / 100).toFixed(2)),
        escapeCsvCell((o.discount_paise / 100).toFixed(2)),
        escapeCsvCell((o.shipping_paise / 100).toFixed(2)),
        escapeCsvCell((o.total_paise / 100).toFixed(2)),
        escapeCsvCell((o.items || []).length),
        escapeCsvCell(itemsSummary),
        escapeCsvCell(o.notes || ''),
      ].join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shiva_shakthi_sales_orders_${dateFilter}_${getLocalDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Orders CSV report exported successfully!');
  };

  // CSV Export: Product Performance Report
  const handleExportProductsCsv = () => {
    if (bestSellingProducts.length === 0) {
      toast.error('No product sales data in this period to export.');
      return;
    }

    const headers = [
      'Rank',
      'Product Name',
      'SKU',
      'Units Sold',
      'Gross Revenue (INR)',
      'Orders Count',
      'Average Unit Price (INR)',
      'Revenue Share (%)',
    ];

    const rows = bestSellingProducts.map((p, idx) => [
      escapeCsvCell(idx + 1),
      escapeCsvCell(p.name),
      escapeCsvCell(p.sku),
      escapeCsvCell(p.unitsSold),
      escapeCsvCell((p.revenuePaise / 100).toFixed(2)),
      escapeCsvCell(p.ordersCountNum),
      escapeCsvCell((p.avgPricePaise / 100).toFixed(2)),
      escapeCsvCell(`${p.revenueSharePercent}%`),
    ].join(','));

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shiva_shakthi_product_sales_${dateFilter}_${getLocalDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Product sales performance CSV exported successfully!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="gold">Confirmed</Badge>;
      case 'processing':
        return <Badge variant="gold">Processing</Badge>;
      case 'shipped':
        return <Badge variant="blue">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="green">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="red">Cancelled</Badge>;
      case 'inquiry_pending':
      default:
        return <Badge variant="gray">Inquiry Pending</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Revenue & Sales Analytics — {APP_NAME} Admin</title>
      </Helmet>

      <div className="space-y-6 sm:space-y-8">
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-brand-maroon bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold/30">
                Financial Intelligence
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-mono">
                {metrics.recognizedCount} Recognized Orders ({metrics.collectedCount} Collected)
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
              <span>Revenue & Sales Analytics</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Real-time revenue recognition, sales velocity, WhatsApp inquiry tracking, and catalog health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Record WhatsApp Order CTA */}
            <Button
              variant="primary"
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm text-xs font-bold px-3.5 py-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record WhatsApp Order</span>
            </Button>

            {/* CSV Export Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportOrdersCsv}
              className="flex items-center gap-1.5 text-xs border-stone-300 text-stone-700 hover:border-brand-gold bg-white"
              title="Download Orders CSV with safe escaping for accountants and bookkeeping"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Orders CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProductsCsv}
              className="flex items-center gap-1.5 text-xs border-stone-300 text-stone-700 hover:border-brand-gold bg-white"
              title="Download Product Performance CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Product Sales CSV</span>
            </Button>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              title="Refresh sales data"
              className="p-2 border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-maroon' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filter Strip */}
        <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            <span className="text-xs font-semibold text-stone-500 mr-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>

            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All-Time' },
              { id: 'custom', label: 'Custom Range' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id as DateFilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  dateFilter === f.id
                    ? 'bg-stone-900 text-brand-gold border-stone-900 shadow-sm font-bold'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 text-xs bg-stone-50 p-1.5 rounded-lg border border-stone-200 w-full md:w-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none"
              />
              <span className="text-stone-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none"
              />
            </div>
          )}

          {/* Active summary label */}
          <div className="text-[11px] text-stone-500 font-mono hidden lg:block shrink-0">
            Showing {filteredOrders.length} records in view
          </div>
        </div>

        {/* 4 Core Financial KPI Cards (Separating Merchandise vs Net vs Profit) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Gross Merchandise Sales (Before Discounts) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-[#C5A059]/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Gross Merchandise Sales
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-stone-900">
              {loading ? <Spinner size="sm" /> : formatPrice(metrics.grossMerchandiseSalesPaise)}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
              <span>Before discounts & shipping</span>
              <span className="text-emerald-700 font-semibold">{metrics.recognizedCount} orders</span>
            </div>
          </div>

          {/* Card 2: Total Net Recognized Revenue */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-[#C5A059]/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Total Net Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-brand-gold-50 text-brand-maroon flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-stone-900">
              {loading ? <Spinner size="sm" /> : formatPrice(metrics.totalRecognizedRevenuePaise)}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
              <span>Discounts: -{formatPrice(metrics.totalDiscountsPaise)}</span>
              <span>Shipping: +{formatPrice(metrics.totalShippingPaise)}</span>
            </div>
          </div>

          {/* Card 3: Average Order Value (AOV) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-[#C5A059]/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Average Order Value
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-heading font-bold text-stone-900">
              {loading ? <Spinner size="sm" /> : formatPrice(metrics.aovPaise)}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              Mean realized ticket per confirmed customer
            </p>
          </div>

          {/* Card 4: Estimated Profit */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-[#C5A059]/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Estimated Net Profit
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            {metrics.hasRealCostData && metrics.estimatedProfitPaise !== null ? (
              <>
                <p className="mt-3 text-2xl font-heading font-bold text-emerald-800">
                  {formatPrice(metrics.estimatedProfitPaise)}
                </p>
                <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                  ~{metrics.profitMarginPercent}% calculated net margin
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-xs font-semibold text-stone-600 leading-snug">
                  Cost data not configured in catalog
                </p>
                <p className="mt-1 text-[10px] text-stone-400">
                  Profit requires cost price entries per piece
                </p>
              </>
            )}
          </div>
        </div>

        {/* Secondary Row: Payment Realization & Status Pipeline Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Confirmed Orders Card (Distinguishing Collected vs Pending Collection) */}
          <div className="bg-stone-900 text-white rounded-xl p-4 border border-[#C5A059]/30 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wide text-brand-gold">
                Recognized Orders
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-heading">{metrics.recognizedCount} orders</span>
              <span className="text-sm font-mono text-brand-gold">{formatPrice(metrics.totalRecognizedRevenuePaise)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium">
                • Collected: {formatPrice(metrics.collectedRevenuePaise)} ({metrics.collectedCount})
              </span>
              <span className="text-amber-300 font-medium">
                • COD/Pending: {formatPrice(metrics.pendingCollectionValuePaise)} ({metrics.pendingCollectionCount})
              </span>
            </div>
          </div>

          {/* Pending WhatsApp Inquiries */}
          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wide text-amber-800">
                Inquiry Pending (Unpaid)
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-stone-900 font-heading">{metrics.pendingCount} inquiries</span>
              <span className="text-sm font-mono text-amber-700 font-bold">{formatPrice(metrics.pendingValuePaise)}</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              WhatsApp cart inquiries awaiting customer payment verification
            </p>
          </div>

          {/* Cancelled Orders & Lost Revenue */}
          <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wide text-rose-800">
                Cancelled / Refunds
              </span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold text-stone-900 font-heading">{metrics.cancelledCount} cancelled</span>
              <span className="text-sm font-mono text-rose-700 font-bold">{formatPrice(metrics.cancelledValuePaise)}</span>
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Excluded from recognized sales totals
            </p>
          </div>
        </div>

        {/* Interactive Revenue Charts Section */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-maroon" />
                <span>Sales Trend Velocity</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Recognized daily and monthly revenue distribution plotted in your local timezone. Hover over bars to inspect totals.
              </p>
            </div>

            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setChartView('daily')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartView === 'daily'
                    ? 'bg-white text-stone-900 shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Daily View
              </button>
              <button
                type="button"
                onClick={() => setChartView('monthly')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  chartView === 'monthly'
                    ? 'bg-white text-stone-900 shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Monthly View
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          {chartData.length === 0 || metrics.totalRecognizedRevenuePaise === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <BarChart3 className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
              <p className="font-semibold text-stone-600">No recognized sales recorded in this period</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Orders with status &ldquo;Confirmed&rdquo;, &ldquo;Processing&rdquo;, or &ldquo;Delivered&rdquo; will automatically plot onto this financial chart.
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <div className="h-56 sm:h-64 flex items-end gap-1.5 sm:gap-3 w-full border-b border-stone-200 pb-2 relative">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-0 border-b border-stone-100 text-[9px] font-mono text-stone-400 pl-1">
                  {formatPrice(maxChartRevenuePaise)}
                </div>
                <div className="absolute inset-x-0 top-1/2 border-b border-stone-100 text-[9px] font-mono text-stone-400 pl-1">
                  {formatPrice(Math.round(maxChartRevenuePaise / 2))}
                </div>

                {/* Bars */}
                {chartData.map((bar, idx) => {
                  const heightPercent = maxChartRevenuePaise > 0
                    ? Math.max(4, Math.round((bar.revenuePaise / maxChartRevenuePaise) * 100))
                    : 4;
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={bar.key}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Floating Tooltip */}
                      {isHovered && bar.revenuePaise > 0 && (
                        <div className="absolute -top-14 z-20 bg-stone-950 text-white text-[10px] rounded-lg p-2 shadow-xl whitespace-nowrap border border-[#C5A059]/40 pointer-events-none">
                          <p className="font-bold text-brand-gold">{bar.label}</p>
                          <p className="font-mono">{formatPrice(bar.revenuePaise)} ({bar.orderCount} {bar.orderCount === 1 ? 'order' : 'orders'})</p>
                        </div>
                      )}

                      {/* Bar fill */}
                      <div
                        className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 relative ${
                          bar.revenuePaise > 0
                            ? isHovered
                              ? 'bg-brand-maroon shadow-gold-sm ring-2 ring-[#C5A059]'
                              : 'bg-gradient-to-t from-[#C5A059] to-[#E5C378] hover:brightness-110'
                            : 'bg-stone-100'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        {bar.revenuePaise > 0 && (
                          <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/40 rounded-full mx-1" />
                        )}
                      </div>

                      {/* X-axis Label */}
                      <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono mt-2 truncate w-full text-center">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Section: Best-Selling Products & Best-Selling Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best-Selling Products */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-stone-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-maroon" />
                  <span>Top Performing Jewellery Pieces</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Ranked by cumulative recognized revenue and units sold.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-stone-400">
                {bestSellingProducts.length} items sold
              </span>
            </div>

            {bestSellingProducts.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-xs">
                No product-level sales recorded in this period.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {bestSellingProducts.slice(0, 5).map((p, idx) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-stone-900 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {p.sku ? `SKU: ${p.sku} • ` : ''}
                          {p.unitsSold} units in {p.ordersCountNum} orders
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-stone-900">{formatPrice(p.revenuePaise)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">{p.revenueSharePercent}% share</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Best-Selling Categories & Inventory Health */}
          <div className="space-y-6">
            {/* Top Categories */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-heading text-base font-bold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <span>Category Revenue Distribution</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Gross revenue contribution per collection.
                  </p>
                </div>
              </div>

              {bestSellingCategories.length === 0 ? (
                <div className="py-6 text-center text-stone-400 text-xs">
                  No category sales recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {bestSellingCategories.slice(0, 4).map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800">{c.name}</span>
                        <span className="font-mono font-bold text-stone-900">
                          {formatPrice(c.revenuePaise)} ({c.sharePercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-maroon h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, c.sharePercent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Health Summary Widget */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="font-heading text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Catalogue Inventory Health</span>
                </span>
                <Link
                  to="/admin/out-of-stock"
                  className="text-xs text-brand-maroon font-semibold hover:underline flex items-center gap-1"
                >
                  Manage <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-xl font-heading font-bold text-rose-800">
                    {inventorySummary.outOfStockCount}
                  </p>
                  <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-tight mt-0.5">
                    Out of Stock
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xl font-heading font-bold text-amber-800">
                    {inventorySummary.lowStockCount}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-tight mt-0.5">
                    Low Stock
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xl font-heading font-bold text-emerald-800">
                    {inventorySummary.healthyCount}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-tight mt-0.5">
                    Healthy Stock
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtered Orders Audit Trail */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-heading text-base font-bold text-stone-900">
                Orders in Selected Period ({filteredOrders.length})
              </h3>
              <p className="text-xs text-stone-500">
                Audit list of orders submitted in this time window.
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-brand-maroon hover:text-brand-gold flex items-center gap-1"
            >
              <span>Manage in Orders Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No orders found matching the selected date filter range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Subtotal</th>
                    <th className="py-2.5 px-3">Discount</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.slice(0, 15).map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                        {order.order_number}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 font-mono">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-800">
                        {order.customer_name || 'Customer'}
                        {order.customer_phone && (
                          <span className="block text-[10px] text-stone-400 font-mono">
                            {order.customer_phone}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">
                        {formatPrice(order.subtotal_paise)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-600">
                        {order.discount_paise > 0 ? `-${formatPrice(order.discount_paise)}` : '₹0'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                        {formatPrice(order.total_paise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length > 15 && (
                <div className="pt-3 text-center border-t border-stone-100">
                  <Link
                    to="/admin/orders"
                    className="text-xs font-semibold text-brand-maroon hover:underline"
                  >
                    View remaining {filteredOrders.length - 15} orders in Orders Portal →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Record WhatsApp Order Modal */}
      <RecordWhatsAppOrderModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onOrderCreated={() => {
          loadData();
        }}
        products={products}
      />
    </>
  );
}
