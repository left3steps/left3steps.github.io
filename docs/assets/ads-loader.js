// Do not load live ads on localhost, IP previews, or other deployment hosts.
if (location.protocol === "https:" && location.hostname === "left3steps.github.io") {
  const client = document.currentScript?.dataset.adsenseClient;
  if (client === "ca-pub-1146138210876381") {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  }
}
