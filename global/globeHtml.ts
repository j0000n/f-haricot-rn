export const GLOBE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>World Globe</title>
    <style>
      html, body { margin: 0; padding: 0; overflow: hidden; background: #000011; }
      #globeViz { width: 100vw; height: 100vh; }
      .marker-label {
        position: absolute;
        padding: 4px 8px;
        background: rgba(0,0,0,0.7);
        color: white;
        border-radius: 4px;
        font-size: 10px;
        pointer-events: auto;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div id="globeViz"></div>
    <script src="https://unpkg.com/three"></script>
    <script src="https://unpkg.com/globe.gl"></script>
    <script>
      const globeContainer = document.getElementById('globeViz');

      const worldGlobe = Globe()
        (globeContainer)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundColor('#000011')
        .showAtmosphere(true)
        .atmosphereColor('lightskyblue')
        .showGraticules(true);

      // HTML markers setup, following html-markers example
      let markers = [];

      function renderMarkers() {
        worldGlobe
          .htmlElementsData(markers)
          .htmlLat(d => d.lat)
          .htmlLng(d => d.lng)
          .htmlAltitude(d => d.altitude || 0.01)
          .htmlElement(d => {
            const el = document.createElement('div');
            el.className = 'marker-label';
            el.textContent = d.label;
            el.onclick = () => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', payload: d }));
              }
            };
            return el;
          });
      }

      // Listen for messages from React Native to update markers
      document.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'setMarkers') {
            markers = data.payload || [];
            renderMarkers();
          }
        } catch (e) {
          console.error('Failed to process message from React Native', e);
        }
      });

      // For iOS WebView (postMessage bridge)
      window.addEventListener('message', function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'setMarkers') {
            markers = data.payload || [];
            renderMarkers();
          }
        } catch (e) {
          console.error('Failed to process message from React Native (iOS)', e);
        }
      });
    </script>
  </body>
</html>`;
