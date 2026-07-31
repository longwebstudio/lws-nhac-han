/**
 * Dynamic SEO & Open Graph Meta Tag Manager for LWS Sổ Thu Bảo Hiểm
 * Automatically injects and updates OG tags, Twitter cards, and Schema.org metadata
 */

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

export const DEFAULT_SEO: SEOProps = {
  title: 'LWS Sổ Thu Bảo Hiểm Online - Ứng Dụng Miễn Phí Nhắc Hạn BHYT & BHXH | Long Web Studio',
  description: 'Ứng dụng Sổ Thu Bảo Hiểm Online miễn phí phát triển bởi Freelancer Long Web Studio giúp Nhân viên thu BHXH, BHYT quản lý danh sách người dân, tự động tính giảm trừ hộ gia đình và gửi tin nhắn Zalo/SMS nhắc hạn đóng 3 giây.',
  keywords: 'sổ thu bảo hiểm online, LWS sổ thu bảo hiểm online, phần mềm sổ thu bảo hiểm online, ứng dụng nhắc hạn bảo hiểm online, nhân viên thu bhxh bhyt, Freelancer Long Web Studio, nhắc hạn BHYT online, nhắc hạn BHXH tự nguyện online, quản lý người dân đóng BHYT, nhắc hạn Zalo 3s, BHYT hộ gia đình, tra cứu thẻ BHYT',
  ogType: 'website',
  ogImage: 'https://sothu.longwebstudio.io.vn/og-image.jpg',
  ogUrl: 'https://sothu.longwebstudio.io.vn/',
  canonicalUrl: 'https://sothu.longwebstudio.io.vn/',
};

/**
 * Dynamically updates document head meta tags for SEO & Open Graph
 */
export function updateSEOTags(customSEO: Partial<SEOProps> = {}) {
  if (typeof document === 'undefined') return;

  const seo = { ...DEFAULT_SEO, ...customSEO };

  // Update Page Title
  document.title = seo.title || DEFAULT_SEO.title!;

  // Helper to update or create a meta tag by property or name attribute
  const setMeta = (attrName: 'name' | 'property', attrValue: string, content: string) => {
    let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Primary Meta Tags
  setMeta('name', 'title', seo.title || DEFAULT_SEO.title!);
  setMeta('name', 'description', seo.description || DEFAULT_SEO.description!);
  setMeta('name', 'keywords', seo.keywords || DEFAULT_SEO.keywords!);

  // Open Graph / Facebook / Zalo
  setMeta('property', 'og:type', seo.ogType || DEFAULT_SEO.ogType!);
  setMeta('property', 'og:site_name', 'LWS Sổ Thu Bảo Hiểm');
  setMeta('property', 'og:url', seo.ogUrl || DEFAULT_SEO.ogUrl!);
  setMeta('property', 'og:title', seo.title || DEFAULT_SEO.title!);
  setMeta('property', 'og:description', seo.description || DEFAULT_SEO.description!);
  setMeta('property', 'og:image', seo.ogImage || DEFAULT_SEO.ogImage!);
  setMeta('property', 'og:image:secure_url', seo.ogImage || DEFAULT_SEO.ogImage!);
  setMeta('property', 'og:image:type', 'image/jpeg');
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '630');
  setMeta('property', 'og:image:alt', seo.title || DEFAULT_SEO.title!);
  setMeta('property', 'og:locale', 'vi_VN');

  // Twitter
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:domain', 'sothu.longwebstudio.io.vn');
  setMeta('name', 'twitter:url', seo.ogUrl || DEFAULT_SEO.ogUrl!);
  setMeta('name', 'twitter:title', seo.title || DEFAULT_SEO.title!);
  setMeta('name', 'twitter:description', seo.description || DEFAULT_SEO.description!);
  setMeta('name', 'twitter:image', seo.ogImage || DEFAULT_SEO.ogImage!);

  // Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', seo.canonicalUrl || DEFAULT_SEO.canonicalUrl!);
}
