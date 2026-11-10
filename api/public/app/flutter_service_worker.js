'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"canvaskit/canvaskit.js": "8331fe38e66b3a898c4f37648aaf7ee2",
"canvaskit/skwasm_heavy.js": "740d43a6b8240ef9e23eed8c48840da4",
"canvaskit/skwasm_heavy.js.symbols": "0755b4fb399918388d71b59ad390b055",
"canvaskit/chromium/canvaskit.js": "a80c765aaa8af8645c9fb1aae53f9abf",
"canvaskit/chromium/canvaskit.wasm": "a726e3f75a84fcdf495a15817c63a35d",
"canvaskit/chromium/canvaskit.js.symbols": "e2d09f0e434bc118bf67dae526737d07",
"canvaskit/skwasm.js.symbols": "3a4aadf4e8141f284bd524976b1d6bdc",
"canvaskit/skwasm.js": "8060d46e9a4901ca9991edd3a26be4f0",
"canvaskit/skwasm.wasm": "7e5f3afdd3b0747a1fd4517cea239898",
"canvaskit/skwasm_heavy.wasm": "b0be7910760d205ea4e011458df6ee01",
"canvaskit/canvaskit.wasm": "9b6a7830bf26959b200594729d73538e",
"canvaskit/canvaskit.js.symbols": "a3c9f77715b642d0437d9c275caba91e",
"flutter.js": "24bc71911b75b5f8135c949e27a2984e",
"flutter_bootstrap.js": "20dfaa3a3b94a252483e8b18d6f38096",
"index.html": "d84ab3f134eb554484f0c02269af4c06",
"/": "d84ab3f134eb554484f0c02269af4c06",
"main.dart.js": "51f323836362dbc54ce23bb0c79025ca",
"version.json": "16e6cc4d9873d63bb8399000a18a328c",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/shadcn_ui/fonts/Geist-Thin.otf": "8603d0fe0def4273ebeee670eedcfb86",
"assets/packages/shadcn_ui/fonts/Geist-UltraLight.otf": "b64b37fbec0a925067cbf530e4962fec",
"assets/packages/shadcn_ui/fonts/Geist-Regular.otf": "4d02716b4f2f2e4d9c568c8d24e8e74d",
"assets/packages/shadcn_ui/fonts/Geist-Light.otf": "21f434e8c2b53240a0c459b9d119f22f",
"assets/packages/shadcn_ui/fonts/Geist-Medium.otf": "f7ceaf00b58d396cf93ff1ea43740027",
"assets/packages/shadcn_ui/fonts/Geist-SemiBold.otf": "2c0b1d3e7b1c71bedc2eecf78f7a1d1d",
"assets/packages/shadcn_ui/fonts/Geist-Bold.otf": "d3e1d3dc690224fd330969af598a9c31",
"assets/packages/shadcn_ui/fonts/Geist-Black.otf": "cf003c4f85b590cf60bec1e111ebaaf5",
"assets/packages/shadcn_ui/fonts/Geist-UltraBlack.otf": "f3591a030925294b2bb427e6a6c9b0d8",
"assets/packages/shadcn_ui/fonts/GeistMono-Thin.otf": "cbf62a8e76578e03404b0314787d9477",
"assets/packages/shadcn_ui/fonts/GeistMono-UltraLight.otf": "45ea4a4ba1034f7fa081c8b7ee958734",
"assets/packages/shadcn_ui/fonts/GeistMono-Regular.otf": "42af0dfdb5e9e272e7ac28868b5b99fb",
"assets/packages/shadcn_ui/fonts/GeistMono-Light.otf": "92c6dfb1c2854b6b0fd3f63ab5af9b7a",
"assets/packages/shadcn_ui/fonts/GeistMono-Medium.otf": "b1f17a06e50fba3f1e9695c2a8ae0783",
"assets/packages/shadcn_ui/fonts/GeistMono-Bold.otf": "fce632a1c87f36e92fb23ae5618176ce",
"assets/packages/shadcn_ui/fonts/GeistMono-Black.otf": "d72857791f93bbf88629ab9601ebfa14",
"assets/packages/shadcn_ui/fonts/GeistMono-UltraBlack.otf": "cfad4eb45ce5dff853a6c84c8a7d441b",
"assets/packages/shadcn_ui/fonts/GeistMono-SemiBold.otf": "02036797116901c5db4a3a629561e588",
"assets/packages/lucide_icons_flutter/assets/build_font/LucideVariable-w100.ttf": "f1990569916d0f2eac4704548f23cb2c",
"assets/packages/lucide_icons_flutter/assets/build_font/LucideVariable-w200.ttf": "df5c6c0b1543068a2925cf4c1f6e9795",
"assets/packages/lucide_icons_flutter/assets/build_font/LucideVariable-w300.ttf": "a7e77601eb4975254b134cec0a329bf2",
"assets/packages/lucide_icons_flutter/assets/build_font/LucideVariable-w400.ttf": "5b0c848e89c8e323891ee79fa4d4f202",
"assets/packages/lucide_icons_flutter/assets/build_font/LucideVariable-w500.ttf": "c3566aed4d20c2190ab25f74fa7640b6",
"assets/packages/lucide_icons_flutter/assets/build_font/LucideVariable-w600.ttf": "6408319148d94a39ef6faf45ac3feaf6",
"assets/packages/lucide_icons_flutter/assets/lucide.ttf": "1e2215ddec473168c71923f2965a624d",
"assets/fonts/MaterialIcons-Regular.otf": "7381927ebccc64b9a306f78d5e25ae34",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/shaders/stretch_effect.frag": "40d68efbbf360632f614c731219e95f0",
"assets/AssetManifest.bin": "83122a4d4b536264828414845ac40fbd",
"assets/AssetManifest.bin.json": "ae9365d5b4533aee8bee3394db3ad069",
"assets/FontManifest.json": "40b12a256d61a8e4ce901924907e6fcf",
"assets/NOTICES": "29adb50eb811604a5ab47c9c886a9ec1",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"manifest.json": "4ae8d3405e45f587726a9c15407ea225",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"main.dart.js_1.part.js": "5ff90059d7221d0f84220b9fc3e0c13f",
"main.dart.js_5.part.js": "0a31b87a0027a0e716b41d96893c7128",
"main.dart.js_6.part.js": "6fbf810724e351ff59da1356d1fe4ea5",
"main.dart.js_7.part.js": "c9742777ec12414a92038b97096bedde",
"main.dart.js_9.part.js": "e1b95bd367dd95a78c5f944d8f3e6e7c",
"main.dart.js_12.part.js": "e9e3b57234ea86e8494728fed9e4b1f6",
"main.dart.js_14.part.js": "289ec45560422fbfe878da6fca64699a",
"main.dart.js_19.part.js": "487d6e7a3e0961d63494ed5288dfdb02",
"main.dart.js_20.part.js": "d36d8543f041629fe32a0ac8516cb0ad",
"main.dart.js_21.part.js": "8b5c38d8e39c4269ca7f3f3936dc447c",
"main.dart.js_27.part.js": "f3a3ad3faa54642f7da19cb90644d784",
"main.dart.js_29.part.js": "59b7463c8f2359f95301152baefac323",
"main.dart.js_33.part.js": "51ae039984c047780afaa84f9da867ac",
"main.dart.js_34.part.js": "61e8edb3f573439924b469a818a8c3f1",
"main.dart.js_37.part.js": "ed59651d0289952075da146e0cefed10",
"main.dart.js_40.part.js": "cf17c87ccd68bd86b457d2d1b1524333",
"main.dart.js_41.part.js": "f75a1e8c95c7e0bcb40a7062fe2f3182",
"main.dart.js_44.part.js": "bd713d91fe15dbd7838dcf48e82ad133",
"main.dart.js_46.part.js": "100b30486bd6c46e4418b8494ab1316d",
"main.dart.js_47.part.js": "c1a88cbdc4ec714c45c4d24a6ef4f37f",
"main.dart.js_48.part.js": "26864cba67f06fad0c0ca940ca071f5b",
"main.dart.js_49.part.js": "59b28bfaf06b96917ac3e8a07de49f3f",
"main.dart.js_51.part.js": "8970491bcc141e48e24c7f108c80fd42",
"main.dart.js_52.part.js": "ef999f8bf2f52ea400dec8fdd08c4004",
"main.dart.js_53.part.js": "cf00589a04ee1d2b46d12a7933ff5caa",
"main.dart.js_54.part.js": "4ce19c11cd06fcad053dec1416dcd3cb",
"main.dart.js_55.part.js": "6527f377ab5ad104b923dcfea7ba87b2",
"main.dart.js_56.part.js": "1d75dfde7a63a5f993e6aa9ecd4d5a0b",
"main.dart.js_57.part.js": "58c3df975a619d15d0ebd316ca6a5536",
"main.dart.js_59.part.js": "9546118b283d54a190b680fdd8d2bd60",
"main.dart.js_60.part.js": "c45916bc1e6e32ba2ecccd98ac56bba9",
"main.dart.js_61.part.js": "79a622851d7217b6d1cf9ca7c0cf056d",
"main.dart.js_62.part.js": "28d2afceb16a3ba6cb423f5e89452e95",
"main.dart.js_64.part.js": "a034aaa261dc234f9277c90256b38a84",
"main.dart.js_65.part.js": "a6f12edb69586f83920c9b9c2520eb31",
"main.dart.js_68.part.js": "e6b8d627aec197940d2a49781afe20b2",
"main.dart.js_70.part.js": "762c4108061ee45c71f080659c2510f5",
"main.dart.js_71.part.js": "e7ee9633b6511cbdd31b51749e66011b",
"main.dart.js_74.part.js": "dac2d29053604f39f4418bf4b070d997",
"main.dart.js_75.part.js": "cfc2b7f499d015da044b4cbf2837407f",
"main.dart.js_76.part.js": "486a6fc67aae44969f7e3272158ec104",
"main.dart.js_77.part.js": "f012cccae7926dd4791212ac5ae13f90",
"main.dart.js_78.part.js": "899f3b04d2e38e985675d217affa0fcc",
"main.dart.js_79.part.js": "2d26c54b0e1dfa738a51ceb2629835d5",
"main.dart.js_80.part.js": "8c3cee9a56e53f5ce281173a674b77d6",
"main.dart.js_81.part.js": "16e63c1a53e9f0299fbde4ebe6e22263",
"main.dart.js_82.part.js": "8ce7a1067f3421d9018f516b535c8cd6",
"main.dart.js_83.part.js": "ce39cd9de3a424fef16cb70c13f45ecd",
"main.dart.js_84.part.js": "8bceb94fe84aad7e4eae8c58134ca4be",
"main.dart.js_85.part.js": "912994ce6570b6b73b8276ab21b3f50d",
"main.dart.js_86.part.js": "6773a8a6c2d1e23268cb6a2526aa9001",
"main.dart.js_87.part.js": "ccd1dfa7af685bd5b75729388a3e51f9",
"main.dart.js_90.part.js": "3056abfdab618b1b6a4fa06aa7c3e416",
"main.dart.js_91.part.js": "488034d7917a0d9693f74e33401e1f16",
"main.dart.js_92.part.js": "16ba670381d2ec05c68bd080fb02559a",
"main.dart.js_93.part.js": "11c990835d2a606fcaf2b3891a4e6925",
"main.dart.js_94.part.js": "f7b8efdfbba2cfba943d717e0047161e",
"main.dart.js_95.part.js": "756a8377abb46b05be079bb64c93db99",
"main.dart.js_96.part.js": "b4960b11c2856432b750ea58a5e5dd86",
"main.dart.js_97.part.js": "422ddfba6251e33949ac0560aa1bc3b7",
"main.dart.js_98.part.js": "7b3f266ca72f4e4af561aafa0893c244",
"main.dart.js_99.part.js": "60eb0ceb0ef490b24b5b8910797868fc",
"main.dart.js_100.part.js": "e1d8aacec7bb30219bc0e6dcb943c476",
"main.dart.js_101.part.js": "2146560210f899c4e010c6d3f88db6f0",
"main.dart.js_102.part.js": "9c3b58744802db40592aa149c903b07e",
"main.dart.js_103.part.js": "4188cdae5d4b6e378ca5fcfb0ee39da1",
"main.dart.js_104.part.js": "bb18a8fadc68671956e1ebeba700ecb2",
"main.dart.js_105.part.js": "e098d8091c62003078cd7ba85529a624",
"main.dart.js_106.part.js": "a31fc0abe5ac942fe3ba4383c6b9a67e",
"main.dart.js_108.part.js": "208811d576af79dea46f5f295ce757a3",
"main.dart.js_109.part.js": "ff60c03dc16c5f7a8589ac81209a9421",
"main.dart.js_110.part.js": "60ddb242e7d75755cd2b9da239b6677d",
"main.dart.js_111.part.js": "6e52869dcc619acfa522c57cf3c74136",
"main.dart.js_112.part.js": "4d8783ea82c177074e3db012a06383f0",
"main.dart.js_113.part.js": "6f09d7f4a6a91f437a05a39672de452e",
"main.dart.js_114.part.js": "2283bce85cf2a80051fece905dffb4de",
"main.dart.js_115.part.js": "4f02e1f8f04ecde420bb918961eca7ac",
"main.dart.js_116.part.js": "e0fc5f8634f2d845c9f0cf67c1599ebf",
"main.dart.js_117.part.js": "554b6168f0b9f62603e23c23bd9feeab",
"main.dart.js_118.part.js": "ab4b030d9a0e7b16ad747165cf4961c5",
"main.dart.js_119.part.js": "ea29edfc8a482f1b48eea625bdcf077e",
"main.html": "d84ab3f134eb554484f0c02269af4c06"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
