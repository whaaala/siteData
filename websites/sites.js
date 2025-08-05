const dailypost = {
  siteUrl: [
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
  ],
  listings: {
    mainContainerEl: ".jeg_inner_content",
    postHeadLineContainerEl: "",
    postContainerEl: ".jeg_posts",
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

const notJustOk = {
  siteUrl: [
    "https://notjustok.com/news",
    "https://notjustok.com/category/songs",
    "https://notjustok.com/category/song/lyrics/",
    "https://notjustok.com/category/videos/",
  ],
  listings: {
    mainContainerEl: ".jeg_inner_content",
    postHeadLineContainerEl: "",
    postContainerEl: ".jeg_posts",
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

// const siteNames = [notJustOk];
// const siteNames = [notJustOk];
const siteNames = [leadership];
// const siteNames = [dailypost, leadership];

export default siteNames;