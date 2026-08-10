package io.github.takina888.marketbase;

/**
 * Starts MARKET BASE through the user's browser.
 *
 * <p>Android Browser Helper verifies Digital Asset Links and opens a Trusted Web Activity when
 * ownership is valid. If the selected browser does not implement TWA, or verification fails, the
 * manifest explicitly requests a Custom Tab fallback. No WebView is used.</p>
 */
public final class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
}
