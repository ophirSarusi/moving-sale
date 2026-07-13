"use strict";

(() => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);

    try {
      const requestUrl = typeof input === "string"
        ? new URL(input, document.baseURI)
        : new URL(input.url, document.baseURI);

      if (!requestUrl.pathname.endsWith("/data/items.json") || !response.ok) {
        return response;
      }

      const payload = await response.clone().json();
      if (!payload || !Array.isArray(payload.items)) return response;

      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json; charset=utf-8");

      return new Response(JSON.stringify(payload.items), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error("Could not adapt item data", error);
      return response;
    }
  };
})();
