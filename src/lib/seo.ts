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
  title: 'LWS Sổ Thu Bảo Hiểm - Phần Mềm Quản Lý BHYT & BHXH Cho Nhân Viên Thu',
  description: 'Sổ thu công nghệ chuyên nghiệp dành cho Nhân viên thu BHXH, BHYT. Tự động tính định mức BHYT hộ gia đình (lương cơ sở 2.530.000đ), nhắc đáo hạn Zalo/SMS 3 giây, quản lý danh sách không giới hạn.',
  keywords: 'LWS Sổ thu bảo hiểm, sổ thu bảo hiểm, nhân viên thu bhxh bhyt, phần mềm quản lý BHYT, quản lý BHXH tự nguyện, ứng dụng nhắc hạn bảo hiểm, nhân viên thu BHYT, điểm thu BHXH, BHYT hộ gia đình, nhắc hạn Zalo SMS, tra cứu thẻ BHYT, Long Web Studio',
  ogType: 'website',
  ogImage: 'https://i0.wp.com/longwebstudio.net/wordpress/wp-content/uploads/2026/06/lws-nhac-han-banner.png?fit=1200%2C630&ssl=1',
  ogUrl: 'https://app.longwebstudio.io.vn/',
  canonicalUrl: 'https://app.longwebstudio.io.vn/',
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
  setMeta('property', 'og:image:type', 'image/png');
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '630');
  setMeta('property', 'og:image:alt', seo.title || DEFAULT_SEO.title!);
  setMeta('property', 'og:locale', 'vi_VN');

  // Twitter
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:domain', 'app.longwebstudio.io.vn');
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
