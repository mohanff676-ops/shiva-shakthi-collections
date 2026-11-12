import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Save,
  Package,
  Upload,
  Image as ImageIcon,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  PREVIEW_PRODUCTS,
  getVisiblePreviewProducts,
  savePreviewEditedProduct,
} from '@/data/previewProducts';
import { DEFAULT_CATEGORIES } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { isValidUUID, slugify } from '@/lib/utils';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

// Available authentic imported images for one-click selection
const LOCAL_IMAGE_OPTIONS = [
  '/imported-images/WhatsApp Image 2026-10-22 at 11.43.03 AM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-22 at 11.37.54 AM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-22 at 11.25.46 AM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-22 at 11.22.26 AM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-22 at 11.19.34 AM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-22 at 11.15.43 AM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (1).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM (2).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.04 PM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM (1).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.05 PM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (1).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM (2).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.06 PM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM (1).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.07 PM.jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM (1).jpeg',
  '/imported-images/WhatsApp Image 2026-10-21 at 4.45.08 PM.jpeg',
];

function normalizeCategoryId(rawCatId?: string | null): string {
  if (!rawCatId) return 'cat-sbb';
  if (DEFAULT_CATEGORIES.some((c) => c.id === rawCatId)) {
    return rawCatId;
  }
  const bySlug = DEFAULT_CATEGORIES.find((c) => c.slug === rawCatId);
  if (bySlug) return bySlug.id;

  const legacyMap: Record<string, string> = {
    'cat-7': 'cat-ha', // Hair Accessories
    'cat-5': 'cat-tc', // Thali / devotional chains
    necklaces: 'cat-2',
    rings: 'cat-4',
    earrings: 'cat-1',
    bangles: 'cat-3',
    bracelets: 'cat-6',
    chains: 'cat-bc',
    'bridal-jewellery': 'cat-2',
    'traditional-jewellery': 'cat-lh',
  };
  return legacyMap[rawCatId] || 'cat-sbb';
}

function generateAutoSku(catId: string): string {
  const codeMap: Record<string, string> = {
    'cat-sbb': 'BB',
    'cat-3': 'BAN',
    'cat-tc': 'TC',
    'cat-bc': 'BC',
    'cat-2': 'NECK',
    'cat-lh': 'LH',
    'cat-ha': 'HA',
    'cat-mt': 'MT',
    'cat-cs': 'CS',
    'cat-6': 'BR',
    'cat-1': 'EAR',
    'cat-ch': 'CH',
    'cat-4': 'RNG',
    'cat-bh': 'BH',
    'cat-lbb': 'LBB',
  };
  const prefix = codeMap[catId] || 'JW';
  const randNum = Math.floor(100 + Math.random() * 900);
  return `SSC-${prefix}-${randNum}`;
}

export default function AdminProductEdit() {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);

  // 1. Primary Simple Fields
  const [name, setName] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [stockQuantity, setStockQuantity] = useState(2);
  const [categoryId, setCategoryId] = useState('cat-sbb');
  const [imageUrl, setImageUrl] = useState(LOCAL_IMAGE_OPTIONS[0]);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');

  // 2. Optional "More Details" Accordion
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [slug, setSlug] = useState('');
  const [comparePriceRupees, setComparePriceRupees] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(1);
  const [material, setMaterial] = useState('One Gram Micro Gold Plated Brass Alloy');
  const [weightGrams, setWeightGrams] = useState<string>('24');
  const [tagsString, setTagsString] = useState('jewellery, handcrafted');

  // Status flags
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);

  // Photo library drawer toggle
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);

  // Load product if editing
  useEffect(() => {
    if (!isEditing || !id) return;

    async function loadProduct() {
      setLoading(true);
      let loadedProduct: Product | null = null;

      if (isSupabaseConfigured) {
        try {
          if (isValidUUID(id)) {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .eq('id', id)
              .maybeSingle();

            if (!error && data) {
              loadedProduct = data as Product;
            }
          } else {
            const { data, error } = await supabase
              .from('products')
              .select('*')
              .eq('slug', id)
              .maybeSingle();

            if (!error && data) {
              loadedProduct = data as Product;
            }
          }
        } catch (err) {
          console.warn('[AdminProductEdit] Supabase product query error:', err);
        }
      }

      if (!loadedProduct) {
        const found =
          getVisiblePreviewProducts().find((p) => p.id === id || p.slug === id) ||
          PREVIEW_PRODUCTS.find((p) => p.id === id || p.slug === id);

        if (found) {
          loadedProduct = found;
        }
      }

      if (loadedProduct) {
        populateForm(loadedProduct);
      } else {
        toast.error('Product not found.');
        navigate('/admin/products');
      }
      setLoading(false);
    }

    loadProduct();
  }, [id, isEditing]);

  const populateForm = (p: Product) => {
    setOriginalProduct(p);
    setName(p.name || '');
    setSlug(p.slug || '');
    setSku(p.sku || '');
    setCategoryId(normalizeCategoryId(p.category_id || (p.category as any)?.slug));

    if (p.price_paise !== undefined && p.price_paise !== null) {
      setPriceRupees(String(p.price_paise / 100));
    }
    if (p.compare_at_price_paise !== undefined && p.compare_at_price_paise !== null) {
      setComparePriceRupees(String(p.compare_at_price_paise / 100));
    }

    setStockQuantity(p.stock_quantity ?? 2);
    setLowStockThreshold(p.low_stock_threshold ?? 1);
    setShortDescription(p.short_description || '');
    setDescription(p.description || '');
    setMaterial(p.material || 'One Gram Micro Gold Plated Brass Alloy');
    setWeightGrams(p.weight_grams ? String(p.weight_grams) : '24');
    setTagsString(Array.isArray(p.tags) ? p.tags.join(', ') : 'jewellery');

    if (p.images && p.images.length > 0) {
      const primary = p.images.find((img) => img.is_primary) || p.images[0];
      if (primary?.url) setImageUrl(primary.url);
    }

    setIsPublished(p.is_published ?? true);
    setIsFeatured(p.is_featured ?? false);
    setIsNewArrival(p.is_new_arrival ?? true);
    setIsBestseller(p.is_bestseller ?? false);
  };

  // Upload image handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    const localPreviewUrl = URL.createObjectURL(file);
    setImageUrl(localPreviewUrl);

    // Upload to Supabase Storage bucket 'product-images' if configured
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const cleanName = slugify(file.name.replace(/\.[^/.]+$/, '')) || 'jewellery';
        const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            setImageUrl(publicUrlData.publicUrl);
            toast.success('Photograph uploaded to cloud storage!');
            setUploadingImage(false);
            return;
          }
        } else if (error) {
          console.warn('[Storage] Upload note:', error.message);
        }
      } catch (uploadErr: any) {
        console.warn('[Storage] Upload caught:', uploadErr.message);
      }
    }

    // Graceful fallback to Data URL for instant resilience
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      toast.success('Photograph attached to product!');
      setUploadingImage(false);
    };
    reader.onerror = () => {
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Role verification
    if (!isAdmin) {
      toast.error('Access Denied: Only verified administrators can create or edit products.');
      return;
    }

    // 2. Validate product title
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Please enter a product title.');
      return;
    }

    // 3. Validate price
    const priceNum = parseFloat(priceRupees);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price in rupees (e.g. 299).');
      return;
    }
    const price_paise = Math.round(priceNum * 100);

    // 4. Validate stock
    const qty = parseInt(String(stockQuantity), 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Stock quantity must be 0 or more.');
      return;
    }

    // 5. Auto-generate URL slug if empty or invalid
    let finalSlug = slug.trim();
    if (!finalSlug) {
      finalSlug = slugify(trimmedName);
    }
    if (!finalSlug) {
      finalSlug = `product-${Date.now()}`;
    }

    // 6. Auto-generate SKU if left blank
    let finalSku = sku.trim().toUpperCase();
    if (!finalSku) {
      finalSku = generateAutoSku(categoryId);
    }

    // Compare at price in paise
    const compareNum = comparePriceRupees.trim() ? parseFloat(comparePriceRupees) : null;
    const compare_at_price_paise = compareNum !== null && !isNaN(compareNum) ? Math.round(compareNum * 100) : null;

    // Short description fallback
    const finalShortDesc = shortDescription.trim() || `${trimmedName} — handcrafted fine Indian jewellery piece.`;
    const finalDesc = description.trim() || finalShortDesc;

    const tagsArray = tagsString
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Image payload
    let updatedImages: any[] = [];
    if (originalProduct?.images && Array.isArray(originalProduct.images) && originalProduct.images.length > 0) {
      updatedImages = originalProduct.images.map((img: any, idx: number) => {
        if (idx === 0 || img.is_primary) {
          return {
            ...img,
            url: imageUrl.trim(),
            alt_text: trimmedName,
            is_primary: true,
          };
        }
        return img;
      });
    } else {
      updatedImages = [
        {
          id: `img-${Date.now()}`,
          url: imageUrl.trim(),
          alt_text: trimmedName,
          sort_order: 1,
          is_primary: true,
        },
      ];
    }

    const payload: any = {
      name: trimmedName,
      slug: finalSlug,
      sku: finalSku,
      category_id: categoryId,
      price_paise,
      compare_at_price_paise,
      stock_quantity: qty,
      low_stock_threshold: parseInt(String(lowStockThreshold), 10) || 1,
      short_description: finalShortDesc,
      description: finalDesc,
      material: material.trim() || 'One Gram Micro Gold Plated Brass Alloy',
      weight_grams: weightGrams.trim() ? parseFloat(weightGrams) : 24,
      tags: tagsArray.length > 0 ? tagsArray : ['jewellery'],
      images: updatedImages,
      is_published: isPublished,
      is_featured: isFeatured,
      is_new_arrival: isNewArrival,
      is_bestseller: isBestseller,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);

    try {
      if (isSupabaseConfigured) {
        const targetDbId =
          originalProduct?.id && isValidUUID(originalProduct.id)
            ? originalProduct.id
            : id && isValidUUID(id)
            ? id
            : null;

        if (isEditing && targetDbId) {
          // Update existing database product
          const { data, error } = await supabase
            .from('products')
            .update(payload)
            .eq('id', targetDbId)
            .select();

          if (error) {
            if (error.code === '42501') {
              throw new Error('Database Permission Denied: Only administrators can edit products.');
            }
            if (error.code === '23505') {
              throw new Error('A piece with this SKU or slug already exists. Please verify SKU and title.');
            }
            throw error;
          }
          if (!data || data.length === 0) {
            throw new Error('Product update could not be recorded in database.');
          }
        } else if (isEditing && !targetDbId) {
          // Editing preview item into permanent database product
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('slug', payload.slug)
            .maybeSingle();

          if (existing?.id) {
            const { data, error } = await supabase
              .from('products')
              .update(payload)
              .eq('id', existing.id)
              .select();
            if (error) throw error;
          } else {
            const { data, error } = await supabase
              .from('products')
              .insert([payload])
              .select();
            if (error) throw error;
          }
        } else {
          // Adding a brand new product
          let insertPayload = { ...payload };
          let { data, error } = await supabase
            .from('products')
            .insert([insertPayload])
            .select();

          // Handle unique collision on slug or sku with automatic graceful resolution
          if (error && error.code === '23505') {
            if (error.message.includes('slug')) {
              insertPayload.slug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
            }
            if (error.message.includes('sku')) {
              insertPayload.sku = `${finalSku}-${Math.floor(10 + Math.random() * 90)}`;
            }
            const retry = await supabase.from('products').insert([insertPayload]).select();
            data = retry.data;
            error = retry.error;
          }

          if (error) {
            if (error.code === '42501') {
              throw new Error('Database Permission Denied: Admin role required to create products in Supabase.');
            }
            throw error;
          }

          if (!data || data.length === 0) {
            throw new Error('Database insert rejected by Row Level Security.');
          }
        }
      }

      // Synchronize local preview fallback
      const savedProductId = originalProduct?.id || id || `prod-${Date.now()}`;
      savePreviewEditedProduct({
        ...(originalProduct || {}),
        ...payload,
        id: savedProductId,
      } as Product);

      // Invalidate queries so admin catalogue and live storefront refresh immediately
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['product'] });
      await queryClient.invalidateQueries({ queryKey: ['product', payload.slug] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      toast.success(
        isEditing
          ? 'Product details updated successfully!'
          : 'Jewellery piece saved and published to catalogue!'
      );

      navigate('/admin/products');
    } catch (err: any) {
      console.error('[AdminProductEdit] Save error:', err);
      toast.error(err.message || 'Failed to save product changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-brand-gold mb-3" />
        <p className="text-xs text-gray-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Edit Product' : 'Add New Product'} — {APP_NAME}</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              title="Back to products catalogue"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Jewellery Piece' : 'Add New Jewellery Piece'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditing
                  ? `SKU: ${sku || 'Auto'} • ${originalProduct?.id ? 'Live DB Record' : 'Catalogue Preview'}`
                  : 'Fast, simple jewellery publishing to your live catalogue'}
              </p>
            </div>
          </div>

          {isEditing && slug && (
            <Link
              to={`/product/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:text-brand-gold hover:border-brand-gold transition-colors self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View on Storefront</span>
            </Link>
          )}
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Core Product Information */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-gold" />
                  <span>Essential Product Details</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill in these quick details to add your piece to the store.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Quick Publish
              </span>
            </div>

            {/* 1. Product Name */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!isEditing && !slug) {
                    setSlug(slugify(e.target.value));
                  }
                }}
                placeholder="e.g. Gold Green Pendant Black Beads Necklace"
                className="w-full px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 font-medium"
              />
            </div>

            {/* 2. Price & Stock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Price in Rupees (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    placeholder="299"
                    className="w-full pl-8 pr-4 py-2.5 text-sm font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Automatically converted to ₹{priceRupees || '0'} for checkout and WhatsApp ordering.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-800">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      stockQuantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {stockQuantity > 0 ? `${stockQuantity} In Stock` : 'Out of Stock'}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                  placeholder="2"
                  className="w-full px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Quantity on hand. Setting to 0 automatically lists item under Out of Stock.
                </p>
              </div>
            </div>

            {/* 3. Category Dropdown (All 15 Categories) */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 bg-white font-medium text-gray-900 cursor-pointer"
              >
                {DEFAULT_CATEGORIES.map((cat, idx) => (
                  <option key={cat.id} value={cat.id}>
                    {idx + 1}. {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Select from all 15 official Shiva Shakthi Collections categories.
              </p>
            </div>

            {/* 4. Product Photograph & Upload */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-800">
                Product Photograph <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Visual Preview */}
                <div className="w-36 h-44 rounded-xl border border-gray-300 bg-stone-900 overflow-hidden relative shadow-sm shrink-0">
                  <img
                    src={imageUrl}
                    alt="Product Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        '/imported-images/WhatsApp Image 2026-10-21 at 4.45.03 PM.jpeg';
                    }}
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-xs">
                      <Spinner size="sm" className="mb-1 text-brand-gold" />
                      <span>Attaching...</span>
                    </div>
                  )}
                </div>

                {/* Upload & Choose Controls */}
                <div className="space-y-3 flex-1 w-full">
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 text-stone-900 font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-brand-maroon" />
                      <span>Upload Image from Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPhotoLibrary(!showPhotoLibrary)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                      <span>{showPhotoLibrary ? 'Hide Photo Library' : 'Choose from 19 Studio Photos'}</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Upload any photo from your phone or PC, or choose one of the authentic studio photos below. Image paths are automatically configured for fast live display.
                  </p>

                  {/* Expandable Studio Photos Library */}
                  {showPhotoLibrary && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                        <span>Click any studio photo to apply:</span>
                        <span className="text-[10px] text-gray-400">19 Authentic Pieces</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                        {LOCAL_IMAGE_OPTIONS.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setImageUrl(img);
                              toast.success(`Photo selected (#${i + 1})`);
                            }}
                            className={`aspect-square rounded-lg border overflow-hidden transition-all relative ${
                              imageUrl === img
                                ? 'ring-2 ring-brand-gold border-brand-gold scale-95 shadow-md'
                                : 'opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                          >
                            <img src={img} alt={`Studio Option ${i + 1}`} className="w-full h-full object-cover" />
                            {i < 6 && (
                              <span className="absolute bottom-0 right-0 bg-brand-maroon text-[8px] font-bold text-white px-1 rounded-tl">
                                New
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Optional SKU Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-800">
                  SKU Code <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-gray-400">
                  {sku ? 'Custom SKU' : `Auto-generates as SSC-...`}
                </span>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Leave blank to auto-generate (e.g. SSC-BB-01)"
                className="w-full px-4 py-2.5 text-xs font-mono uppercase border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>

            {/* 6. Optional Description Field */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Handcrafted detailing, auspicious daily wear, festive styling notes, care instructions..."
                className="w-full px-4 py-2.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 leading-relaxed"
              />
            </div>

            {/* Primary Action Button */}
            <div className="pt-4 border-t border-gray-100">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={saving}
                className="w-full py-3.5 text-base font-bold shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving to Catalogue...' : isEditing ? 'Save Product Changes' : 'Save Product'}</span>
              </Button>
            </div>
          </div>

          {/* Optional "More Details" Accordion */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-brand-gold" />
                <span className="text-sm font-bold text-gray-900">
                  More Details & Advanced Settings
                </span>
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  Optional
                </span>
              </div>
              {showMoreDetails ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showMoreDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">
                {/* Slug & Strike Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Custom URL Slug
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="e.g. gold-green-pendant-black-beads-necklace"
                      className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Store URL: /product/{slug || '...'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Compare at Price (₹ Strike-through)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={comparePriceRupees}
                        onChange={(e) => setComparePriceRupees(e.target.value)}
                        placeholder="e.g. 499"
                        className="w-full pl-7 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Material & Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Material Composition
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="One Gram Micro Gold Plated Alloy"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Weight in Grams
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(e.target.value)}
                      placeholder="24"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                    />
                  </div>
                </div>

                {/* Tags & Low Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Search Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tagsString}
                      onChange={(e) => setTagsString(e.target.value)}
                      placeholder="black-beads, necklace, mangalsutra"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                    />
                  </div>
                </div>

                {/* Visibility Badges */}
                <div className="pt-3 border-t border-gray-100">
                  <span className="block text-xs font-bold text-gray-800 mb-2">
                    Storefront Visibility & Featured Badges
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 text-brand-maroon rounded focus:ring-brand-gold"
                      />
                      <span>Published</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 text-brand-maroon rounded focus:ring-brand-gold"
                      />
                      <span>Featured</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                        className="w-4 h-4 text-brand-maroon rounded focus:ring-brand-gold"
                      />
                      <span>New Arrival</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={isBestseller}
                        onChange={(e) => setIsBestseller(e.target.checked)}
                        className="w-4 h-4 text-brand-maroon rounded focus:ring-brand-gold"
                      />
                      <span>Bestseller</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
