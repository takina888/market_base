(function marketBaseInstallHelper() {
  'use strict';

  var SAMSUNG_UA = /SamsungBrowser\//i;
  var SEEN_KEY = 'market_base_samsung_install_guidance_v1';
  var isSamsungInternet = SAMSUNG_UA.test(navigator.userAgent || '');
  var installEventSuppressed = false;
  var dialog = null;

  if (!isSamsungInternet) return;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  function configuredAndroidPackageUrl() {
    var meta = document.querySelector('meta[name="market-base-android-package-url"]');
    var raw = meta ? String(meta.getAttribute('content') || '').trim() : '';
    if (!raw) return '';

    try {
      var url = new URL(raw, document.baseURI);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function cleanCurrentUrl() {
    var url = new URL(window.location.href);
    url.searchParams.delete('install');
    return url;
  }

  function chromeIntentUrl() {
    var url = cleanCurrentUrl();
    var scheme = url.protocol.replace(':', '');
    // Android intent URIs reserve the fragment for the #Intent section.
    // Keep the normal page hash only in the encoded browser fallback URL.
    var target = url.host + url.pathname + url.search;
    return 'intent://' + target + '#Intent;scheme=' + scheme +
      ';package=com.android.chrome;S.browser_fallback_url=' +
      encodeURIComponent(url.href) + ';end';
  }

  function markGuidanceSeen() {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch (_) {}
  }

  function guidanceWasSeen() {
    try {
      return window.localStorage.getItem(SEEN_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function closeDialog() {
    if (!dialog) return;
    markGuidanceSeen();
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
      dialog.classList.remove('mb-install-help-fallback');
    }
  }

  function showDialog() {
    if (isStandalone()) return;
    ensureDialog();
    if (!dialog || dialog.open) return;
    markGuidanceSeen();
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
      dialog.classList.add('mb-install-help-fallback');
    }
  }

  function ensureDialog() {
    if (dialog) return dialog;

    var packageUrl = configuredAndroidPackageUrl();
    dialog = document.createElement('dialog');
    dialog.id = 'mbInstallHelpDialog';
    dialog.className = 'mb-install-help-dialog';
    dialog.setAttribute('aria-labelledby', 'mbInstallHelpTitle');
    dialog.innerHTML =
      '<section class="mb-install-help-card">' +
        '<header class="mb-install-help-head">' +
          '<div>' +
            '<p class="mb-install-help-kicker">Samsung Internetを検出</p>' +
            '<h2 class="mb-install-help-title" id="mbInstallHelpTitle">MARKET BASEを端末から開く</h2>' +
          '</div>' +
          '<button class="mb-install-help-close" type="button" aria-label="案内を閉じる" data-mb-install-close>×</button>' +
        '</header>' +
        '<p class="mb-install-help-summary">Samsung Internetが生成するWebAPKは、端末によってGoogle Play Protectに止められることがあります。サイト側からそのWebAPKのAndroid対象バージョンは変更できないため、このページではWebAPKのインストール画面を自動実行しません。</p>' +
        '<div class="mb-install-help-actions">' +
          '<a class="mb-install-help-action mb-install-help-action--primary" data-mb-install-action="android-package" hidden>公式Android版をダウンロード（推奨）</a>' +
          '<a class="mb-install-help-action" href="install/samsung-shortcut.htm" data-mb-install-action="samsung-shortcut">APKを使わないホーム画面ショートカット</a>' +
          '<a class="mb-install-help-action" data-mb-install-action="chrome">Chromeで開いてインストール</a>' +
        '</div>' +
        '<details class="mb-install-help-details" data-mb-android-install-steps hidden>' +
          '<summary>Android版をインストールできない場合の設定</summary>' +
          '<ol>' +
            '<li>上の「公式Android版をダウンロード」を押し、ダウンロード完了後にAPKを開きます。</li>' +
            '<li>「この提供元を許可」または「不明なアプリをインストール」と表示された場合は「設定」を押します。</li>' +
            '<li>アプリ一覧で「Samsung Internet」を選び、「この提供元を許可」をオンにします（繁體中文表示では「允許此來源」）。</li>' +
            '<li>前の画面へ戻り、「インストール」を押します。完了後、この許可はオフへ戻して構いません。</li>' +
          '</ol>' +
          '<p class="mb-install-help-security">Google Play Protectは無効にしないでください。通常の安全確認を有効にしたままインストールしてください。</p>' +
        '</details>' +
        '<p class="mb-install-help-note">ショートカット版はSamsung InternetでMARKET BASEを開きます。Androidアプリとして入れる方法ではないため、Play ProtectによるAPKの判定は発生しません。Samsung Internet自身がアドレスバーなどに出すインストール表示は、サイト側から完全には非表示にできません。</p>' +
        '<details class="mb-install-help-details">' +
          '<summary>Samsung Internetでショートカットを作る手順</summary>' +
          '<ol><li>上の「APKを使わないホーム画面ショートカット」を押します。</li><li>表示された専用ページで、Samsung Internetのメニューから「ページを追加」→「ホーム画面」を選びます。</li><li>作成したMARKET BASEアイコンを押すと、このページが開きます。</li></ol>' +
        '</details>' +
      '</section>';

    var packageAction = dialog.querySelector('[data-mb-install-action="android-package"]');
    var packageSteps = dialog.querySelector('[data-mb-android-install-steps]');
    if (packageUrl) {
      packageAction.href = packageUrl;
      packageAction.download = 'MARKET_BASE_V333_19_ANDROID_API36_RELEASE_20260810.apk';
      packageAction.hidden = false;
      packageSteps.hidden = false;
    }

    dialog.querySelector('[data-mb-install-action="chrome"]').href = chromeIntentUrl();
    dialog.querySelector('[data-mb-install-close]').addEventListener('click', closeDialog);
    dialog.addEventListener('cancel', markGuidanceSeen);
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeDialog();
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installEventSuppressed = true;
    if (!guidanceWasSeen()) showDialog();
  });

  function init() {
    if (isStandalone()) return;
    ensureDialog();
    var requested = new URL(window.location.href).searchParams.get('install');
    if (requested === '1' || requested === 'samsung' || !guidanceWasSeen()) {
      showDialog();
    }
    window.dispatchEvent(new CustomEvent('marketbase:install-help-ready', {
      detail: {
        browser: 'samsung-internet',
        webApkPromptSuppressed: installEventSuppressed,
        androidPackageConfigured: !!configuredAndroidPackageUrl()
      }
    }));
  }

  window.MarketBaseInstallHelp = Object.freeze({
    browser: 'samsung-internet',
    open: showDialog,
    hasOfficialAndroidPackage: function () {
      return !!configuredAndroidPackageUrl();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
