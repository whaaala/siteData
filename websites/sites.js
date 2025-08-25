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


// const siteNames = [dailypost, leadership, gistlover, notJustOk, naijanews];
const siteNames = [naijanews];


export default siteNames;