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
    // "https://www.gistlover.com/category/entertainment",
    "https://www.gistlover.com/category/extra",
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

// const siteNames = [dailypost, leadership, gistlover];
const siteNames = [gistlover];


export default siteNames;