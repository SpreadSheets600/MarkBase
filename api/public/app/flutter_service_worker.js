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
"flutter_bootstrap.js": "c352bf243f996787152f7c37ee10821b",
"index.html": "d84ab3f134eb554484f0c02269af4c06",
"/": "d84ab3f134eb554484f0c02269af4c06",
"main.dart.js": "0f2c202f4e3722cd0f69804d5703fd86",
"version.json": "ec4acdd4204e5dce112da880d707a8b8",
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
"assets/fonts/MaterialIcons-Regular.otf": "1e6864458ebc3719272524dc5133a462",
"assets/shaders/stretch_effect.frag": "40d68efbbf360632f614c731219e95f0",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "83122a4d4b536264828414845ac40fbd",
"assets/AssetManifest.bin.json": "ae9365d5b4533aee8bee3394db3ad069",
"assets/FontManifest.json": "40b12a256d61a8e4ce901924907e6fcf",
"assets/NOTICES": "b98d909618a3f2227744266ad6061acc",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"manifest.json": "4ae8d3405e45f587726a9c15407ea225",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"main.dart.js_1.part.js": "e73f9aa5b522f827d02b52058f782c80",
"main.dart.js_5.part.js": "d5ed345b3c6d89d49eb1827938714016",
"main.dart.js_6.part.js": "3a924ca6b11141beca8f1889eb8ea477",
"main.dart.js_7.part.js": "23af677f9fff7e9ef7ae52b0a6b819bb",
"main.dart.js_9.part.js": "e1891c8234282312db9ec8493a10c4a8",
"main.dart.js_12.part.js": "56ab629d9397b3b1c5724918dba9a04d",
"main.dart.js_14.part.js": "760b4c3166e7d2d5f1b419e924d98dfe",
"main.dart.js_19.part.js": "2420f31773a37314f84add641eebea90",
"main.dart.js_20.part.js": "fe5cb046b51d75454c1e1348023a4c59",
"main.dart.js_21.part.js": "5cd9a8d08d2a083381d7ea4652c4113d",
"main.dart.js_27.part.js": "4ae93fd2e6aa9c1fe7fb84d4af4432d1",
"main.dart.js_29.part.js": "dc0167e1d2d15b6fab1fd9fa5c26bf3b",
"main.dart.js_33.part.js": "d1ab97b6ef790a095680c2874c049bf5",
"main.dart.js_34.part.js": "12aa0f20a4caee242b9361dd79478a6f",
"main.dart.js_37.part.js": "50cb0deeb20810c16bb55278de6a8a46",
"main.dart.js_40.part.js": "a9f213815af90c0e3c043b1e2803984b",
"main.dart.js_41.part.js": "26bc1ac582e8fefa45a3025ad9ae55d3",
"main.dart.js_44.part.js": "72670ad1cc335a014e7eab9bef4a085c",
"main.dart.js_46.part.js": "d791836f9e3ace7eb8f587dab4c9126c",
"main.dart.js_47.part.js": "89deee4c06049c81022982a1cf937b22",
"main.dart.js_48.part.js": "cb6ebabd5448b5c77f3f6446e85e4962",
"main.dart.js_49.part.js": "7263225a012347750cafdf6c845b1a6e",
"main.dart.js_51.part.js": "a3a06e5ac8f421a3ecfda8c493cea597",
"main.dart.js_52.part.js": "9b6c23d1c3162ba06c66e6a4ae9eb393",
"main.dart.js_53.part.js": "2487108acc1bede2a38f3e5f1d6af476",
"main.dart.js_54.part.js": "628f04ac7fb98688729ba0e9aa85da31",
"main.dart.js_55.part.js": "ba1486e85092600553a72735cefd45a9",
"main.dart.js_56.part.js": "001e3754618ccbcea04386226affaa0b",
"main.dart.js_57.part.js": "fc08531c7f12573c34427ad352a34d21",
"main.dart.js_59.part.js": "7fd65245202026b544cff46831bd4b2b",
"main.dart.js_60.part.js": "80ca71d4f2ab1dfb9a6d1e1a3e41a55a",
"main.dart.js_61.part.js": "32c0eaa1f02e7bd15dcacd51c127f3df",
"main.dart.js_62.part.js": "67a45b968b5a82e1b1851f92d3e683c0",
"main.dart.js_64.part.js": "6cd93eb2240994431d57779aeba4f2aa",
"main.dart.js_65.part.js": "af6e39844a53cc581801a4ead665aca3",
"main.dart.js_68.part.js": "85fce8b0c3363cbd8731a3fc23cf6d32",
"main.dart.js_70.part.js": "f9907560f26b49e9364b20e062ad8023",
"main.dart.js_71.part.js": "af88c1485a9ec600fe2a98df0581ff7e",
"main.dart.js_74.part.js": "38b5ca81f751cdfaf476dd05df45a847",
"main.dart.js_75.part.js": "fd98e9f40ce4b54ff4b1a6f8b57ed842",
"main.dart.js_76.part.js": "a0938e3f4f2e5a70533c7cbffb50caf6",
"main.dart.js_77.part.js": "6aeed13388029afe5a37ba90c97cd071",
"main.dart.js_78.part.js": "ee6ebb73c55245773261dbaec5b437e9",
"main.dart.js_79.part.js": "00a726ab594fc3d481a9b7004ddbdbe7",
"main.dart.js_80.part.js": "1015be68685d84ff2cce63dc2a5ea474",
"main.dart.js_81.part.js": "f495f53fa6456d7bd33ede1dcf896e48",
"main.dart.js_82.part.js": "1906be6d2dc746f5bc8c9b3aa97a26c0",
"main.dart.js_83.part.js": "7f491f485357f606de826276ae34d887",
"main.dart.js_84.part.js": "80ed80df8459542315d3a739b317c925",
"main.dart.js_85.part.js": "a2d88fe89d9bbb7d2bfe19199e536c8c",
"main.dart.js_86.part.js": "8d04341c34c1b55ee06e1b4a3c76b43e",
"main.dart.js_87.part.js": "7af14d43d75d921ba4a68698a0acc422",
"main.dart.js_90.part.js": "b65ce30a7bf6d173191ba3ea0fb13826",
"main.dart.js_91.part.js": "47407c07b97e5538d229f28c02a8899d",
"main.dart.js_92.part.js": "49772b977d5731e6a3a6d2113124ac47",
"main.dart.js_93.part.js": "2a84720ec1fe111794182f6c35399336",
"main.dart.js_94.part.js": "41f67febd618a309cbca48ff6941ccb2",
"main.dart.js_95.part.js": "9e2e531f3562412089ac5b607be0732d",
"main.dart.js_96.part.js": "f9ed85cbf9015ab259bc4c6e36922f42",
"main.dart.js_97.part.js": "ecd327ba938413fdf024a50cf5af5e30",
"main.dart.js_98.part.js": "79a117e696656d4b8ed567fe7d2fab61",
"main.dart.js_99.part.js": "4abc4cc1065ead3a4c7015aef652da9f",
"main.dart.js_100.part.js": "ee8f9f99ed1f5c836cb682497c725b9a",
"main.dart.js_101.part.js": "c6a6a8faa71e7b006609423d5fd891f1",
"main.dart.js_102.part.js": "2772df0801506df1d811cecdd899113c",
"main.dart.js_103.part.js": "b7f94f09274f7e16a7c1bc0395d9e672",
"main.dart.js_104.part.js": "2fa426ecbfbb02bed9530444a69639f7",
"main.dart.js_105.part.js": "ef5c63ad9451697aebea47da443360e4",
"main.dart.js_106.part.js": "1df591858974f179dae774d8a4477467",
"main.dart.js_108.part.js": "60234b5a126f57def2ae247bafb37c8b",
"main.dart.js_109.part.js": "04a51c7f76118aab38530e59f8dfa9eb",
"main.dart.js_110.part.js": "6e746815424f9ac9f5c6cfe0a141a84e",
"main.dart.js_111.part.js": "4f9d8ce11ffddcc1220c0b966b2dfd7f",
"main.dart.js_112.part.js": "96349a35dee2cf94cb57041c5e2a2850",
"main.dart.js_113.part.js": "ac2a1db6b79bd09dfdcc77df808d0d0a",
"main.dart.js_114.part.js": "3a72ba1ef46af76736491b5fb87a494f",
"main.dart.js_115.part.js": "2eab6b0fe90a19822fc067815e88624a",
"main.dart.js_116.part.js": "5ad2663b0c7da57e70b3002250d2d0e9",
"main.dart.js_117.part.js": "aad0f77ee81a18e904b48439503c2495",
"main.dart.js_118.part.js": "521387b8ce2aed80b12b4297035e09f4",
"main.dart.js_119.part.js": "3629b609744d010f681a3ddad687fd61",
"main.html": "d84ab3f134eb554484f0c02269af4c06",
"main.dart.js_11.part.js": "34edbe67964fb50b7368dba36dc8cf3c",
"main.dart.js_13.part.js": "f918d6f6ad3243b87ca471fad3265bb0",
"main.dart.js_18.part.js": "2c9944d257e386577325ade6b2006ed3",
"main.dart.js_24.part.js": "b1a6418ad7b6fd8532f8b82da8e6b209",
"main.dart.js_25.part.js": "909d9f3c049779bae66c23142f136161",
"main.dart.js_30.part.js": "54ce01bec7ee0e7b4053262e0ce3e149",
"main.dart.js_36.part.js": "97e242558112d27e44064ce000b7fddc",
"main.dart.js_39.part.js": "00d160861218c0dd6650a5b8dc569bc9",
"main.dart.js_42.part.js": "69eb49c4d2253f746e360358a7f82141",
"main.dart.js_43.part.js": "fcac4468a37d1720d61d75881b8e66fb",
"main.dart.js_50.part.js": "0f15a8254ea106e580375490e355afd6",
"main.dart.js_63.part.js": "e4412e23ba1a4d11e2163342a2ea3e10",
"main.dart.js_66.part.js": "fd325da01f58c9971539d45ca29d31f2",
"main.dart.js_69.part.js": "f330b3554d5db5fc104a899ead9b965a",
"main.dart.js_72.part.js": "95d2a23402e38a433c48310d676bc5d0",
"main.dart.js_73.part.js": "8f82d3a92a2bda99cb5f997c25ee0721",
"main.dart.js_88.part.js": "539ad44f70ce04e64500607d3d5b0a13",
"main.dart.js_89.part.js": "ea24c32166ee23a06d8d1ae12fe7cc6a",
"main.dart.js_107.part.js": "3c36acea6313c2b204a509607c193709"};
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
