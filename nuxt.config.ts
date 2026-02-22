export default defineNuxtConfig({
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/google-fonts",
  ],
  googleFonts: {
    families: {
      Quicksand: [300, 400, 500, 600, 700],
    },
    display: "swap",
    prefetch: true,
    preconnect: true,
  },
  devtools: {
    enabled: true,
  },
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE || "http://localhost:3000/api/v1",
      websocketBase: process.env.NUXT_PUBLIC_WS_BASE || "http://localhost:3000",
      stripePublishableKey:
        process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      cartShippingFee: process.env.CART_SHIPPING_FEE || "90",
      cartFreeShippingThreshold:
        process.env.CART_FREE_SHIPPING_THRESHOLD || "400",
    },
  },
  alias: {
    shared: "./shared",
  },
  devServer: {
    port: 4000,
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2025-01-15",
  nitro: {
    ignore: [
      "/socket.io/**"
    ]
  }
  // nitro: {
  //   devProxy: {
  //     "/socket.io": {
  //       target: "http://localhost:3000",
  //       ws: true,
  //     },
  //   },
  // },
});
