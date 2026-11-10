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
"flutter_bootstrap.js": "34b53f3b4c5642cba6b10ccb01ceece4",
"index.html": "d84ab3f134eb554484f0c02269af4c06",
"/": "d84ab3f134eb554484f0c02269af4c06",
"main.dart.js": "adc3d2b88cd3b2e5844cb79eaef028f6",
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
"assets/fonts/MaterialIcons-Regular.otf": "b989a3c86093a63c51a9a8525fff196b",
"assets/shaders/stretch_effect.frag": "40d68efbbf360632f614c731219e95f0",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
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
"main.dart.js_1.part.js": "d68026863670a6c0046b25104036a3ce",
"main.dart.js_5.part.js": "05f574f06bbcdbbf00be278ba9e07894",
"main.dart.js_6.part.js": "20e9c2f3fb2349caf2d6694be92a658f",
"main.dart.js_7.part.js": "85b847096db9d1011561c0e40b7c06df",
"main.dart.js_9.part.js": "a9e0d908cbfb186de0fc6d1f896513f8",
"main.dart.js_12.part.js": "a7c18a1ca4bd1889ebd7da8872020c55",
"main.dart.js_14.part.js": "bdb97d252a5025bb8c1f7d8ae0168530",
"main.dart.js_19.part.js": "4ff0aabb055236f9e7d2c429db4dd359",
"main.dart.js_20.part.js": "f1c79f90a7c5034157a4c21e34e2a544",
"main.dart.js_21.part.js": "7f01a0a3dfdb94f8948a04fc25ccf575",
"main.dart.js_27.part.js": "066b8ccab4918fc31c3626df500efdce",
"main.dart.js_29.part.js": "a350cfe3343cd863353e453341496d69",
"main.dart.js_33.part.js": "ff9c0cbacb54b6a400ce16363219e36d",
"main.dart.js_34.part.js": "25445ca3eb846dd284fa011bf331d69b",
"main.dart.js_37.part.js": "7959009e2b12ebcb3ff9abf91e93e89b",
"main.dart.js_40.part.js": "368df4ab23a338899fa29538657c797c",
"main.dart.js_41.part.js": "3648b7cd656b9068099599ee4b5d0e00",
"main.dart.js_44.part.js": "2c4c72d6a0eff147dde76e1b10c38f4b",
"main.dart.js_46.part.js": "9586b24cacaa4b88404fe32824637e39",
"main.dart.js_47.part.js": "83d56a13c5caee2141a89e26f89f0d74",
"main.dart.js_48.part.js": "7be3ee53d80983b66790f73fb0beb46c",
"main.dart.js_49.part.js": "c722d57b0ed2df9a2c46ae839e39b2c1",
"main.dart.js_51.part.js": "cad07f72d5e2c32894fc21bb4191b1c3",
"main.dart.js_52.part.js": "5e275613b42d4eadca238221e9899051",
"main.dart.js_53.part.js": "65678ef210ac527053814291b93cc8d9",
"main.dart.js_54.part.js": "f853fc42691e2aaf1f2300564e42e642",
"main.dart.js_55.part.js": "26932c1aa7fcc694738efe1ca8fdd098",
"main.dart.js_56.part.js": "fd880c130ee8f5769103f09c550e201d",
"main.dart.js_57.part.js": "73380e4efef55b9b036ec6a882129a49",
"main.dart.js_59.part.js": "14e280ab8ff0e826fbbbb664691026dc",
"main.dart.js_60.part.js": "c67bbf0e9a85a9b5fc69c2c301feac00",
"main.dart.js_61.part.js": "86dda95fd2b10c4a877030d938d3410a",
"main.dart.js_62.part.js": "331c4ed074613560d2658b7ef657ba33",
"main.dart.js_64.part.js": "f9e6a8196916410a9373c0fb30317e5d",
"main.dart.js_65.part.js": "37b575e4b5626a552d241301ffe8eeb3",
"main.dart.js_68.part.js": "b3f62494630a0baa77c05de30b810ba9",
"main.dart.js_70.part.js": "bfb15e7b9e383bbd2251f1dece99dd94",
"main.dart.js_71.part.js": "f28253f121f2470023188900f7bf018f",
"main.dart.js_74.part.js": "de25451d0c35fe489e61bb059f9bf0f0",
"main.dart.js_75.part.js": "16142327cea290b152380e4e4d4848f9",
"main.dart.js_76.part.js": "e946e08b0945f3eca9f8d2ce5617c560",
"main.dart.js_77.part.js": "24bf952c2c41de076a731afd2975ae14",
"main.dart.js_78.part.js": "f7d2915d181fb193472e7cfb23de3232",
"main.dart.js_79.part.js": "ef67a622abcbfaff644349733533a0e9",
"main.dart.js_80.part.js": "cc3b8a822668f8ab8766c8e6752284b1",
"main.dart.js_81.part.js": "1234948ddad4f1679f2b4fa658d5f97c",
"main.dart.js_82.part.js": "e55f51b4264519d5bc76c5fbc023f955",
"main.dart.js_83.part.js": "8959a8bb2dae70f24724468c05379a57",
"main.dart.js_84.part.js": "3f0c210bbe626041d5b1c7df8cf26aee",
"main.dart.js_85.part.js": "6ba6f793a85726a448eea2a5d5354e09",
"main.dart.js_86.part.js": "4efa1a586c58f9ea2f12555e35643ffe",
"main.dart.js_87.part.js": "572894f119d7bd0fa17bcb94f5736749",
"main.dart.js_90.part.js": "34ed3e27a43dca2fbe03d1f6825ab5e9",
"main.dart.js_91.part.js": "49ef99a21c8d424462ecc047ffcf22a1",
"main.dart.js_92.part.js": "1c403d92120834b668afe6b96620241e",
"main.dart.js_93.part.js": "be7983a7c31812034d86db1cec88e526",
"main.dart.js_94.part.js": "468e89fad890b419a915b80a0077aab3",
"main.dart.js_95.part.js": "bfd9d9b654506570f9774b41444b7310",
"main.dart.js_96.part.js": "77614e535c8b620d29a0620bfe1cb056",
"main.dart.js_97.part.js": "b5853aaef606fa0f58488c61a356f940",
"main.dart.js_98.part.js": "cd409ac7f7fd71c9fd4c830c0c82fb01",
"main.dart.js_99.part.js": "d57a2bddd9930f3f910ee2f4414f6f6e",
"main.dart.js_100.part.js": "749475399f288fc0b248277beb33d740",
"main.dart.js_101.part.js": "597bc1ad5916774aac461492cfacc216",
"main.dart.js_102.part.js": "7889ed615c97cce2bb965737023b0026",
"main.dart.js_103.part.js": "8614c1ed6a110b30baae7b32d12cc57f",
"main.dart.js_104.part.js": "91c4940e1ff46f0c3b3aa8282b9d7ec2",
"main.dart.js_105.part.js": "1e4688c2b57569de29f1d44636ff96d6",
"main.dart.js_106.part.js": "34b7f1d6a95c23d7d999cfa690ba8834",
"main.dart.js_108.part.js": "d9f235c9aec5dce656cd2239cc07e373",
"main.dart.js_109.part.js": "5c004adbeab7840e8d7c59fd45ada342",
"main.dart.js_110.part.js": "23b0126ae3e55376065c8d194981b8bf",
"main.dart.js_111.part.js": "65a938d56b571155682407ef69e3abf7",
"main.dart.js_112.part.js": "174eff25fb800529faa8f8aade9acb75",
"main.dart.js_113.part.js": "587f5737ce2689cfeef00d53dbf45a60",
"main.dart.js_114.part.js": "789c12a58e5d37e17ba32956c1377bef",
"main.dart.js_115.part.js": "09e8479f6e4a01a4a7c758b8d1e109d2",
"main.dart.js_116.part.js": "4bf4fb5b956aec43dbcbca42f0a38e62",
"main.dart.js_117.part.js": "c7ce49f6dc11736f780e644c1696f902",
"main.dart.js_118.part.js": "e867e0f084519af75a45129c90a63cd8",
"main.dart.js_119.part.js": "faab91f3d9cf07d5b36c4a9e1f250b7f"};
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
