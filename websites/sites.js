const dailypost = {
  siteUrl: [
    "https://dailypost.ng/",
    "https://dailypost.ng/hot-news/",
    "https://dailypost.ng/politics/",
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
    "https://leadership.ng/nigeria-news/",
    "https://leadership.ng/politics/",
    "https://leadership.ng/nigeria-news/business-news/",
    "https://leadership.ng/nigeria-news/entertainment-news/"
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
      ".ads-wrapper",
      ".ads-text",
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
    "https://www.gistlover.com/category/news",
    "https://www.gistlover.com/category/entertainment",
    "https://www.gistlover.com/category/extra",
    "https://www.gistlover.com/category/daily-travel-and-scholarships-tips/",
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
    "https://www.naijanews.com/politics/",
    "https://www.naijanews.com/entertainment/",
    "https://www.naijanews.com/business/",
    "https://www.naijanews.com/gist/",
    "https://www.naijanews.com/sports/",
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
    "https://www.gistreel.com/entertainment-news/",
    "https://www.gistreel.com/viral-news/",
    "https://www.gistreel.com/social-issues/",
    "https://www.gistreel.com/sport/",
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
     "https://guardian.ng/category/news/",
    "https://guardian.ng/category/news/nigeria/metro/",
     "https://guardian.ng/category/news/world/africa/",
    "https://guardian.ng/category/sport/",
     "https://guardian.ng/category/life/music/",
     "https://guardian.ng/category/life/film/",
     "https://guardian.ng/category/life/beauty/",
     "https://guardian.ng/category/technology/",
     "https://guardian.ng/category/features/",
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
     "https://punchng.com/topics/news/",
     "https://punchng.com/topics/metro-plus/",
     "https://punchng.com/topics/business/",
     "https://punchng.com/topics/sports/",
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
      'https://healthwise.punchng.com/category/general-health/',
      'https://healthwise.punchng.com/category/impact-stories/',
      'https://healthwise.punchng.com/category/maternal-health/',
      'https://healthwise.punchng.com/category/gender/',
      'https://healthwise.punchng.com/category/sexual-health/',
      'https://healthwise.punchng.com/category/mental-health/',
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

const legit = {
     siteUrl: [
      'https://www.legit.ng/nigeria/',
      'https://www.legit.ng/tags/lagos-state-news-today/',
      'https://www.legit.ng/tags/abuja-city-news-today/',
      'https://www.legit.ng/tags/rivers-state-news-today/',
      'https://www.legit.ng/tags/kano-news-today/',
      'https://www.legit.ng/tags/oyo-state-news-today/',
      'https://www.legit.ng/tags/anambra-state-news-today/',
      'https://www.legit.ng/tags/kwara-state-news-today/',
      'https://www.legit.ng/tags/adamawa-state-news-today/',
      'https://www.legit.ng/politics/',
      'https://www.legit.ng/world/',
      'https://www.legit.ng/world/africa/',
      'https://www.legit.ng/world/europe/',
      'https://www.legit.ng/world/us/',
      'https://www.legit.ng/business-economy/',
      'https://www.legit.ng/business-economy/technology/',
      'https://www.legit.ng/business-economy/energy/',
      'https://www.legit.ng/business-economy/capital-market/',
      'https://www.legit.ng/business-economy/industry/',
      'https://www.legit.ng/business-economy/economy/',
      'https://www.legit.ng/entertainment/',
      'https://www.legit.ng/entertainment/celebrities/',
      'https://www.legit.ng/entertainment/movies/',
      'https://www.legit.ng/entertainment/music/',
      'https://www.legit.ng/entertainment/tv-shows/',
      'https://www.legit.ng/entertainment/nollywood/',
      'https://www.legit.ng/entertainment/fashion/',
      'https://www.legit.ng/people/',
      'https://www.legit.ng/people/wedding/',
      'https://www.legit.ng/people/family-relationship/',
      'https://www.legit.ng/education/',
    ],
  listings: {
    mainContainerEl: '.l-taxonomy-page-hero',
    postHeadLineContainerEl: '',
    postContainerEl: '.js-articles',
  },
  titleEl: {
    tag: '.c-article-card-horizontal__headline span',
    link: '',
  },
  titleLinkEl: {
    tag: '.c-article-card-horizontal__headline',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '.c-breadcrumbs:first-of-type',
    authorEl: '.c-article-info__authors span a',
    datePostedEl: '.c-article-info__time',
    mainContainerEl: 'article',
    contentEl: '.post__content',
    elToReFromPostEl: [
      'ul',
      '.call_to_action',
      '.c-adv',
      'i',
      '.post__read-also',
      '.article-image__button',
      "[dir^='auto']",
    ],
    imageEl: {
      tag: '.article-image__wrapper img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const pulse = {
    siteUrl: [
      'https://www.pulse.ng/news/politics',
      'https://www.pulse.ng/news/local',
      'https://www.pulse.ng/news/metro',
      'https://www.pulse.ng/news/world',
      'https://www.pulse.com.gh/news/politics',
      'https://www.pulse.com.gh/news/local',
      'https://www.pulse.ng/entertainment/celebrities',
      'https://www.pulse.ng/entertainment/music',
      'https://www.pulse.ng/entertainment/movies',
      'https://www.pulse.ng/lifestyle/fashion',
      'https://www.pulse.ng/lifestyle/beauty-and-health',
      'https://www.pulse.ng/lifestyle/relationships-and-weddings',
      'https://www.pulse.ng/business/domestic',
      'https://www.pulse.com.gh/entertainment',
      'https://www.pulse.com.gh/entertainment/celebrities',
      'https://www.pulse.com.gh/entertainment/music',
      'https://www.pulse.com.gh/entertainment/movies',
      'https://www.pulse.com.gh/lifestyle/fashion',
      'https://www.pulse.com.gh/lifestyle/beauty-and-health',
      'https://www.pulse.com.gh/lifestyle/relationships-and-weddings',
      'https://www.pulse.com.gh/business/domestic',
      'https://www.pulse.com.gh/sports/football/ghana-premier-league',
    ],
  listings: {
    mainContainerEl: '.SectionLayout_wrapper__k_YDa',
    postHeadLineContainerEl: '',
    postContainerEl: '.ArticleCardRenderer_articles__VyQm_',
  },
  titleEl: {
    tag: '.news-card__content__text__title-wrapper h3',
    link: '',
  },
  titleLinkEl: {
    tag: '.news-card__content__text__title-wrapper a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '.CategoryTitle_details__UGJmB h1',
  post: {
    categoryEl: '.c-breadcrumbs:first-of-type',
    authorEl: '[class*="FollowAuthorsCard_author__name"]',
    datePostedEl: '[class*="Article_date"]',
    mainContainerEl: '[class*="Article_article-content"]',
    contentEl: '[class*="rich-text-wrapper"]',
    elToReFromPostEl: [
      '.ad-wrapper',
      '.ad-wrapper__content',
    ],
    imageEl: {
      tag: '[class*="Article_hero-image"] img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const thenewsguru = {
    siteUrl: [
    'https://thenewsguru.com/category/news/',
    'https://thenewsguru.ng/category/politics/',
    'https://thenewsguru.ng/category/entertainment/',
    'https://thenewsguru.ng/category/sports/',
    'https://thenewsguru.ng/category/business/',
  ],
  listings: {
    mainContainerEl: '.wp-block-post-template ',
    postHeadLineContainerEl: '',
    postContainerEl: 'li',
  },
  titleEl: {
    tag: '.wp-block-post-title a',
    link: '',
  },
  titleLinkEl: {
    tag: '.wp-block-post-title a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '.taxonomy-category a',
    authorEl: '.wp-block-post-author-name a',
    datePostedEl: '.entry__meta-date',
    mainContainerEl: '.wp-block-group',
    contentEl: '.entry-content',
    elToReFromPostEl: ['.g'],
    imageEl: {
      tag: '.wp-block-post-featured-image img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const brila  = {
   siteUrl: ['https://www.brila.net/football/'],
  listings: {
    mainContainerEl: '.elementor-loop-container',
    postHeadLineContainerEl: '',
    postContainerEl: '.elementor',
  },
  titleEl: {
    tag: '.elementor-widget-container h2',
    link: '',
  },
  titleLinkEl: {
    tag: '.elementor-widget-container a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '.meta-item .category',
    authorEl: '.entry__meta-author a',
    datePostedEl: '.date .post-date',
    mainContainerEl: '.post-content-wrap',
    contentEl: '.post-content',
    elToReFromPostEl: [''],
    imageEl: {
      tag: '.featured img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const brilaOther  = {
   siteUrl: [
    'https://brila.net/niche/boxing/',
    'https://brila.net/niche/basketball/',
    'https://brila.net/niche/womens-basketball/',
  ],
  listings: {
    mainContainerEl: '.block-content',
    postHeadLineContainerEl: '',
    postContainerEl: 'article',
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
  categoryEl: '',
  post: {
    categoryEl: '.meta-item .category',
    authorEl: '.entry__meta-author a',
    datePostedEl: '.date .post-date',
    mainContainerEl: '.post-content-wrap',
    contentEl: '.post-content',
    elToReFromPostEl: [''],
    imageEl: {
      tag: '.featured img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const healthza = {
  siteUrl: [
    'https://womenshealthsa.co.za/food-and-nutrition/',
    'https://womenshealthsa.co.za/health/',
    'https://womenshealthsa.co.za/fitness/',
    'https://womenshealthsa.co.za/style-beauty/',
    'https://womenshealthsa.co.za/life/',
    'https://mh.co.za/fitness/',
    'https://mh.co.za/food-nutrition-2/',
    'https://mh.co.za/style/',
    'https://mh.co.za/health/',
    'https://mh.co.za/life/',
  ],
  listings: {
    mainContainerEl: '.et_pb_blog_grid',
    postHeadLineContainerEl: '',
    postContainerEl: 'article',
  },
  titleEl: {
    tag: '.entry-title a',
    link: '',
  },
  titleLinkEl: {
    tag: '.entry-title a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '.et_pb_title_meta_container [rel="category tag"]:first-of-type',
    authorEl: '.et_pb_title_meta_container .author a',
    datePostedEl: '.et_pb_title_meta_container .published',
    mainContainerEl: '.et_pb_column',
    contentEl: '.et_pb_post_content',
    elToReFromPostEl: [''],
    imageEl: {
      tag: '.et_pb_title_featured_container .et_pb_image_wrap img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const theguardian = {
  siteUrl: ['https://www.theguardian.com/tone/recipes/all'],
  listings: {
    mainContainerEl: 'div[id*="container-"]',
    postHeadLineContainerEl: '',
    postContainerEl: '[data-format-theme="4"] div',
  },
  titleEl: {
    tag: 'h3 span',
    link: '',
  },
  titleLinkEl: {
    tag: 'a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '',
    authorEl: '',
    datePostedEl: '',
    mainContainerEl: '#maincontent',
    contentEl: '.article-body-commercial-selector',
    elToReFromPostEl: [
      '.ad-slot-container',
      '#slot-body-end',
      'svg',
      '[data-print-layout="hide"]',
    ],
    imageEl: {
      tag: '#img-1 .dcr-evn1e9 img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const motorverso = {
  siteUrl: [
    'https://www.motorverso.com/posts/',
    'https://www.motorverso.com/category/maintenance-diy/'
  ],
  listings: {
    mainContainerEl: '#content',
    postHeadLineContainerEl: '',
    postContainerEl: '.entry-wrapper',
  },
  titleEl: {
    tag: '.entry-title a',
    link: '',
  },
  titleLinkEl: {
    tag: '.entry-title a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '',
    authorEl: '.author-info .author-name',
    datePostedEl: '.meta-post-details span:last-child',
    mainContainerEl: 'article',
    contentEl: '.entry-content',
    elToReFromPostEl: [
      '.related-posts',
      '.clear',
      '.ad',
      '.ezoic-ad',
      '.adtester-container',
      '[id*="ezoic-pub-ad-"]',
      '.entry-meta',
    ],
    imageEl: {
      tag: '.entry-thumb img',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

const girlracer = {
  siteUrl: [
    'https://girlracer.co.uk/category/motoring/news/',
    'https://girlracer.co.uk/category/motoring/road-test/',
  ],
  listings: {
    mainContainerEl: '#main',
    postHeadLineContainerEl: '',
    postContainerEl: 'article',
  },
  titleEl: {
    tag: '.entry-title a',
    link: '',
  },
  titleLinkEl: {
    tag: '.entry-title a',
    source: 'href',
  },
  imageEl: {
    tag: '',
    source: '',
    alt: '',
  },
  categoryEl: '',
  post: {
    categoryEl: '',
    authorEl: '.author a',
    datePostedEl: '.entry-date',
    mainContainerEl: '.entry-content-wrapper',
    contentEl: '.entry-content',
    elToReFromPostEl: [
      '.related-posts',
      '.clear',
    ],
    imageEl: {
      tag: '.wp-post-image',
      tag1: '',
      source: 'src',
      source1: '',
      alt: '',
    },
  },
};

//const siteNames = [dailypost, leadership, gistlover, notJustOk, naijanews, gistreel, guardian, punchng, healthwisePunchng, legit, pulse, thenewsguru, brila, brilaOther, healthza, theguardian, motorverso, girlracer];
const siteNames = [brilaOther];


export default siteNames;