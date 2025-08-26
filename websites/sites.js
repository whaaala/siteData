const dailypost = {
  siteUrl: [
    "https://dailypost.ng/",
    // "https://dailypost.ng/hot-news/",
    // "https://dailypost.ng/politics/",
    "https://dailypost.ng/metro/",
    "https://dailypost.ng/entertainment/",
    "https://dailypost.ng/sport-news/",
  ],
  listings: {
    mainContainerEl: ".mvp-main-blog-body",
    postHeadLineContainerEl: "#mvp-cat-feat-wrap",
    postContainerEl: "ul",
  },
  titleEl: {
    tag: "h2",
    link: "",
  },
  titleLinkEl: {
    tag: "a",
    source: "href",
  },
  imageEl: {
    tag: "img",
    source: "src",
    alt: "",
  },
  post: {
    categoryEl: ".mvp-post-cat span",
    authorEl: ".author-name a",
    datePostedEl: ".post-date",
    mainContainerEl: "#mvp-content-wrap",
    contentEl: "#mvp-content-main",
    elToReFromPostEl: [
      "#google_image_div",
      ".ai-viewport-2",
      ".heateorSssClear",
      ".heateor_sss_sharing_container",
      ".code-block",
    ],
    imageEl: {
      tag: ".attachment-",
      tag1: "",
      source: "src",
      source1: "srcset",
      alt: "",
    },
  },
};

const leadership = {
  siteUrl: [
    "https://leadership.ng/opinion/columns/",
    // "https://leadership.ng/nigeria-news/",
    "https://leadership.ng/politics/",
    // "https://leadership.ng/nigeria-news/business-news/",
    // "https://leadership.ng/nigeria-news/entertainment-news/"
  ],
  listings: {
    mainContainerEl: ".jeg_inner_content",
    postHeadLineContainerEl: "",
    postContainerEl: ".jeg_post",
  },
  titleEl: {
    tag: ".jeg_post_title a",
    link: "",
  },
  titleLinkEl: {
    tag: ".jeg_post_title a",
    source: "href",
  },
  imageEl: {
    tag: "img",
    source: "src",
    alt: "",
  },
  post: {
    categoryEl: ".jeg_meta_category a",
    authorEl: ".jeg_meta_author a",
    datePostedEl: ".meta_left .jeg_meta_date a",
    mainContainerEl: ".jeg_inner_content",
    contentEl: ".content-inner",
    elToReFromPostEl: [
      ".code-block",
      ".jeg_postblock_21",
      ".jnews_inline_related_post",
      ".jeg_post_tags",
      ".jnews_inline_related_post_wrapper",
    ],
    imageEl: {
      tag: ".wp-post-image",
      tag1: "",
      source: "src",
      source1: "srcset",
      alt: "",
    },
  },
};

const gistlover  = {
  siteUrl: [
    "https://www.gistlover.com/category/religion/",
    // "https://www.gistlover.com/category/news",
    "https://www.gistlover.com/category/entertainment",
    // "https://www.gistlover.com/category/extra",
    // "https://www.gistlover.com/category/daily-travel-and-scholarships-tips/z",
  ],
  listings: {
    mainContainerEl: ".mh-content",
    postHeadLineContainerEl: "",
    postContainerEl: "article",
  },
  titleEl: {
    tag: ".entry-title a",
    link: "",
  },
  titleLinkEl: {
    tag: ".entry-title a",
    source: "href",
  },
  imageEl: {
    tag: "",
    source: "src",
    alt: "",
  },
  post: {
    categoryEl: ".mh-meta .entry-meta-categories a",
    authorEl: ".mh-meta .entry-meta-author a",
    datePostedEl: ".mh-meta .entry-meta-date a",
    mainContainerEl: ".mh-content",
    contentEl: ".entry-content",
    elToReFromPostEl: [
      ".code-block",
      ".quads-location",
      "ul",
      ".mh-social-bottom",
    ],
    imageEl: {
      tag: ".wp-block-image img",
      tag1: "",
      source: "src",
      source1: "srcset",
      alt: "",
    },
  },
};

const notJustOk  = {
   siteUrl: [
    "https://notjustok.com/news",
    "https://notjustok.com/category/songs/",
    "https://notjustok.com/category/lyrics/",
    "https://notjustok.com/category/sports/",
  ],
   listings: {
    mainContainerEl: ".article-list-hot",
    postHeadLineContainerEl: "",
    postContainerEl: "ul",
  },
  titleEl: {
    tag: ".list-title h3",
    link: "",
  },
  titleLinkEl: {
    tag: ".list-title",
    source: "href",
  },
  imageEl: {
    tag: "img",
    source: "src",
    alt: "",
  },
   categoryEl: ".article-list-heading h1",
  post: {
    categoryEl: "",
    authorEl: ".single-article-author a",
    datePostedEl: ".single-article-time",
    mainContainerEl: ".single-article-content",
    contentEl: "article",
    elToReFromPostEl: [
      ".code-block",
      ".jeg_postblock_21",
      ".jnews_inline_related_post",
      ".jeg_post_tags",
      ".jnews_inline_related_post_wrapper",
    ],
    imageEl: {
      tag: ".single-article-img img",
      tag1: "",
      source: "src",
      source1: "srcset",
      alt: "",
    },
  },
};

const naijanews = {
   siteUrl: [
    "https://www.naijanews.com/news/",
    // "https://www.naijanews.com/politics/",
    // "https://www.naijanews.com/entertainment/",
    // "https://www.naijanews.com/business/",
    // "https://www.naijanews.com/gist/",
    // "https://www.naijanews.com/sports/",
  ],
   listings: {
    mainContainerEl: ".mvp-main-blog-body",
    postHeadLineContainerEl: "",
    postContainerEl: "ul",
  },
  titleEl: {
    tag: ".mvp-blog-story-text h2",
    link: "",
  },
  titleLinkEl: {
    tag: ".mvp-blog-story-wrap a",
    source: "href",
  },
  imageEl: {
    tag: "",
    source: "",
    alt: "",
  },
   categoryEl: "",
  post: {
    categoryEl: ".mvp-post-cat-link .mvp-post-cat",
    authorEl: ".author-name a",
    datePostedEl: ".post-date",
    mainContainerEl: "#mvp-post-content",
    contentEl: "#mvp-content-main",
    elToReFromPostEl: [
      "#mys-content",
      ".code-block",
      ".ai-viewport-3",
      ".ai-viewports",
      ".copyright",
    ],
    imageEl: {
      tag: ".wp-post-image",
      tag1: "",
      source: "src",
      source1: "data-src",
      alt: "",
    },
  },
};

const gistreel = {
   siteUrl: [
    // "https://www.gistreel.com/entertainment-news/",
    // "https://www.gistreel.com/viral-news/",
    // "https://www.gistreel.com/social-issues/",
    // "https://www.gistreel.com/sport/",
    "https://www.gistreel.com/politics/",
    
  ],
  listings: {
    mainContainerEl: ".main-content",
    postHeadLineContainerEl: "",
    postContainerEl: "ul",
  },
  titleEl: {
    tag: ".post-title a",
    link: "",
  },
  titleLinkEl: {
    tag: ".post-title a",
    source: "href",
  },
  imageEl: {
    tag: "",
    source: "",
    alt: "",
  },
   categoryEl: "",
  post: {
    categoryEl: ".entry-header .post-cat-wrap a",
    authorEl: ".meta-author a",
    datePostedEl: ".date",
    mainContainerEl: "article",
    contentEl: ".entry-content",
    elToReFromPostEl: [
      ".code-block",
      ".stream-item",
      ".post-bottom-meta",
    ],
    imageEl: {
      tag: ".single-featured-image img",
      tag1: "",
      source: "src",
      source1: "data-lazy-src",
      alt: "",
    },
  },
};

const guardian = {
    siteUrl: [
    //  "https://guardian.ng/category/news/",
    // "https://guardian.ng/category/news/nigeria/metro/",
    //  "https://guardian.ng/category/news/world/africa/",
    // "https://guardian.ng/category/sport/",
    //  "https://guardian.ng/category/life/music/",
    //  "https://guardian.ng/category/life/film/",
    //  "https://guardian.ng/category/life/beauty/",
    //  "https://guardian.ng/category/opinion/",
    //  "https://guardian.ng/category/technology/",
    //  "https://guardian.ng/category/features/",
     "https://guardian.ng/category/news/world/europe/",
  ],
   listings: {
    mainContainerEl: ".category-top-section",
    postHeadLineContainerEl: "",
    postContainerEl: ".row",
  },
  titleEl: {
    tag: ".post-info h1 a",
    link: "",
  },
  titleLinkEl: {
    tag: ".post-info h1 a",
    source: "href",
  },
  imageEl: {
    tag: "",
    source: "",
    alt: "",
  },
   categoryEl: ".category-name h1",
  post: {
    categoryEl: "",
    authorEl: ".post-author",
    datePostedEl: ".post-date",
    mainContainerEl: "article",
    contentEl: ".post-content",
    elToReFromPostEl: [
      ".ad-container",
      ".related-articles",
      ".post-bottom-meta",
    ],
    imageEl: {
      tag: ".post-image",
      tag1: "",
      source: "src",
      source1: "data-srcset",
      alt: "",
    },
  },
};

const punchng = {
    siteUrl: [
    //  "https://punchng.com/topics/news/",
    //  "https://punchng.com/topics/metro-plus/",
    //  "https://punchng.com/topics/business/",
    //  "https://punchng.com/topics/sports/",
     "https://punchng.com/topics/punch-lite/",
  ],
  listings: {
    mainContainerEl: '.row',
    postHeadLineContainerEl: '',
    postContainerEl: '.mobile-only',
  },
  titleEl: {
    tag: '.post-title a',
    link: '',
  },
  titleLinkEl: {
    tag: '.post-title a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: 'header .section-title .header-title',
  post: {
    categoryEl: '',
    authorEl: '.post-author a',
    datePostedEl: '.post-date',
    mainContainerEl: '.col-lg-8',
    contentEl: '.post-content',
    elToReFromPostEl: [
      '.ad-container',
      '#show360playvid',
      "[dock^='#pv-dock-slot']",
      "[style^='left']",
      '.post-title',
      '.read-also',
    ],
    imageEl: {
      tag: '.post-image',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const healthwisePunchng = {
    siteUrl: [
      // 'https://healthwise.punchng.com/category/general-health/',
      // 'https://healthwise.punchng.com/category/impact-stories/',
      // 'https://healthwise.punchng.com/category/maternal-health/',
      // 'https://healthwise.punchng.com/category/gender/',
      // 'https://healthwise.punchng.com/category/sexual-health/',
      // 'https://healthwise.punchng.com/category/mental-health/',
       'https://healthwise.punchng.com/category/enviroment/',
    ],
  listings: {
    mainContainerEl: '.td_block_wrap',
    postHeadLineContainerEl: '',
    postContainerEl: '.tdb-block-inner',
  },
  titleEl: {
    tag: 'h3 a',
    link: '',
  },
  titleLinkEl: {
    tag: 'h3 a',
    source: 'href',
  },
  imageEl: {
    tag: '.td-image-wrap span',
    source: 'style',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '.tdb-entry-category',
    authorEl: '.tdb-author-name',
    datePostedEl: '.vc_column-inner .wpb_wrapper .tdb-block-inner .entry-date',
    mainContainerEl: '.tdb_single_content',
    contentEl: '.tdb-block-inner',
    elToReFromPostEl: ["[dir^='auto']"],
    imageEl: {
      tag: '',
      tag1: '',
      source: '',
      source1: '',
      alt: '',
    },
  },
};


// const siteNames = [dailypost, leadership, gistlover, notJustOk, naijanews, gistreel, guardian, punchng, healthwisePunchng];
const siteNames = [healthwisePunchng];


export default siteNames;