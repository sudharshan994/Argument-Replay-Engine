import { useMemo } from 'react';

export default function InsightPanel({ graph }) {
  const totals = (() => {
    if (!graph?.links) {
      return {
        attacks: 0,
        supports: 0,
        questions: 0,
        restates: 0,
      };
    }

    return {
      attacks: graph.links.filter(
        (link) => link.type === 'attack'
      ).length,

      supports: graph.links.filter(
        (link) => link.type === 'support'
      ).length,

      questions: graph.links.filter(
        (link) => link.type === 'question'
      ).length,

      restates: graph.links.filter(
        (link) => link.type === 'restatement'
      ).length,
    };
  })();

  const { mostAttacked, mostSupported } = useMemo(() => {
    const stats = {};

    if (!graph?.nodes || !graph?.links) {
      return {
        mostAttacked: null,
        mostSupported: null,
      };
    }

    graph.nodes.forEach((node) => {
      stats[node.id] = {
        attack_count: 0,
        support_count: 0,
        node,
      };
    });

    graph.links.forEach((link) => {
      const targetId =
        typeof link.target === 'object'
          ? link.target?.id
          : link.target;

      if (stats[targetId]) {
        if (link.type === 'attack') {
          stats[targetId].attack_count += 1;
        }

        if (link.type === 'support') {
          stats[targetId].support_count += 1;
        }
      }
    });

    const sortedByAttacks = Object.values(stats).sort(
      (a, b) => b.attack_count - a.attack_count
    );

    const sortedBySupports = Object.values(stats).sort(
      (a, b) => b.support_count - a.support_count
    );

    return {
      mostAttacked: sortedByAttacks[0] || null,
      mostSupported: sortedBySupports[0] || null,
    };
  }, [graph]);

  if (!graph?.nodes?.length) {
    return null;
  }

  // =========================================================
  // EXPORT JSON
  // =========================================================
  const handleExportJSON = () => {
    try {
      const json = JSON.stringify(
        graph,
        null,
        2
      );

      const blob = new Blob(
        [json],
        {
          type: 'application/json;charset=utf-8',
        }
      );

      const url =
        URL.createObjectURL(blob);

      const downloadLink =
        document.createElement('a');

      downloadLink.href = url;
      downloadLink.download =
        'argument_map.json';

      document.body.appendChild(
        downloadLink
      );

      downloadLink.click();

      downloadLink.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        'JSON export failed:',
        error
      );

      alert(
        'Failed to export JSON. Please try again.'
      );
    }
  };

  // =========================================================
  // COPY SUMMARY
  // =========================================================
  const handleCopySummary = async () => {
    const summary = `Argument Analysis Summary:
- Unique Claims: ${graph.nodes.length}
- Attacks: ${totals.attacks}
- Supports: ${totals.supports}
- Questions: ${totals.questions}`;

    try {
      await navigator.clipboard.writeText(
        summary
      );

      alert(
        'Summary copied to clipboard!'
      );
    } catch (error) {
      console.error(
        'Clipboard API failed:',
        error
      );

      // Browser fallback
      try {
        const textarea =
          document.createElement(
            'textarea'
          );

        textarea.value = summary;

        textarea.style.position =
          'fixed';

        textarea.style.left =
          '-9999px';

        textarea.style.top =
          '0';

        document.body.appendChild(
          textarea
        );

        textarea.focus();
        textarea.select();

        document.execCommand(
          'copy'
        );

        textarea.remove();

        alert(
          'Summary copied to clipboard!'
        );
      } catch (fallbackError) {
        console.error(
          'Clipboard fallback failed:',
          fallbackError
        );

        alert(
          'Could not copy the summary.'
        );
      }
    }
  };

  // =========================================================
  // EXPORT PNG
  // =========================================================
  const handleExportPNG = () => {
    try {
      // Find the SVG used by the D3 argument map.
      let svg =
        document.querySelector(
          '.d3-canvas svg'
        );

      // Fallback if .d3-canvas itself is the SVG.
      if (!svg) {
        const canvasElement =
          document.querySelector(
            '.d3-canvas'
          );

        if (
          canvasElement?.tagName?.toLowerCase() ===
          'svg'
        ) {
          svg = canvasElement;
        }
      }

      if (!svg) {
        alert(
          'Argument map is not available to export.'
        );

        return;
      }

      // -------------------------------------------------------
      // Clone SVG so we never modify the visible graph.
      // -------------------------------------------------------
      const svgClone =
        svg.cloneNode(true);

      // -------------------------------------------------------
      // Get dimensions.
      // -------------------------------------------------------
      const rect =
        svg.getBoundingClientRect();

      let width =
        parseFloat(
          svg.getAttribute('width')
        ) ||
        rect.width ||
        svg.clientWidth ||
        1200;

      let height =
        parseFloat(
          svg.getAttribute('height')
        ) ||
        rect.height ||
        svg.clientHeight ||
        700;

      width = Math.max(
        Number(width) || 1200,
        1
      );

      height = Math.max(
        Number(height) || 700,
        1
      );

      // -------------------------------------------------------
      // Make sure SVG namespaces are present.
      // -------------------------------------------------------
      svgClone.setAttribute(
        'xmlns',
        'http://www.w3.org/2000/svg'
      );

      svgClone.setAttribute(
        'xmlns:xlink',
        'http://www.w3.org/1999/xlink'
      );

      // -------------------------------------------------------
      // Set dimensions correctly.
      // -------------------------------------------------------
      svgClone.setAttribute(
        'width',
        String(width)
      );

      svgClone.setAttribute(
        'height',
        String(height)
      );

      if (
        !svgClone.getAttribute(
          'viewBox'
        )
      ) {
        svgClone.setAttribute(
          'viewBox',
          `0 0 ${width} ${height}`
        );
      }

      // -------------------------------------------------------
      // Add white background rectangle.
      // This makes the exported PNG readable in all themes.
      // -------------------------------------------------------
      const background =
        document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );

      background.setAttribute(
        'x',
        '0'
      );

      background.setAttribute(
        'y',
        '0'
      );

      background.setAttribute(
        'width',
        String(width)
      );

      background.setAttribute(
        'height',
        String(height)
      );

      background.setAttribute(
        'fill',
        '#ffffff'
      );

      svgClone.insertBefore(
        background,
        svgClone.firstChild
      );

      // -------------------------------------------------------
      // Serialize cloned SVG.
      // -------------------------------------------------------
      const serializer =
        new XMLSerializer();

      const svgData =
        serializer.serializeToString(
          svgClone
        );

      // -------------------------------------------------------
      // Convert SVG to Blob.
      // This avoids the old btoa/unescape issue.
      // -------------------------------------------------------
      const svgBlob =
        new Blob(
          [svgData],
          {
            type:
              'image/svg+xml;charset=utf-8',
          }
        );

      const svgUrl =
        URL.createObjectURL(
          svgBlob
        );

      // -------------------------------------------------------
      // Create image.
      // -------------------------------------------------------
      const img =
        new Image();

      img.onload = () => {
        try {
          // 2x resolution for a sharper PNG.
          const scale = 2;

          const canvas =
            document.createElement(
              'canvas'
            );

          canvas.width =
            Math.ceil(
              width * scale
            );

          canvas.height =
            Math.ceil(
              height * scale
            );

          const ctx =
            canvas.getContext(
              '2d'
            );

          if (!ctx) {
            throw new Error(
              'Could not create canvas context.'
            );
          }

          // White background.
          ctx.fillStyle =
            '#ffffff';

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Scale drawing for high-quality output.
          ctx.scale(
            scale,
            scale
          );

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          // ---------------------------------------------------
          // Convert canvas to PNG.
          // ---------------------------------------------------
          canvas.toBlob(
            (pngBlob) => {
              if (!pngBlob) {
                URL.revokeObjectURL(
                  svgUrl
                );

                alert(
                  'Could not create PNG file.'
                );

                return;
              }

              const pngUrl =
                URL.createObjectURL(
                  pngBlob
                );

              const downloadLink =
                document.createElement(
                  'a'
                );

              downloadLink.href =
                pngUrl;

              downloadLink.download =
                'argument_map.png';

              document.body.appendChild(
                downloadLink
              );

              downloadLink.click();

              downloadLink.remove();

              // Clean up.
              setTimeout(() => {
                URL.revokeObjectURL(
                  pngUrl
                );

                URL.revokeObjectURL(
                  svgUrl
                );
              }, 1000);
            },
            'image/png'
          );
        } catch (error) {
          console.error(
            'PNG conversion failed:',
            error
          );

          URL.revokeObjectURL(
            svgUrl
          );

          alert(
            'PNG export failed. Please try again.'
          );
        }
      };

      img.onerror = (error) => {
        console.error(
          'SVG rendering failed:',
          error
        );

        URL.revokeObjectURL(
          svgUrl
        );

        alert(
          'Could not render the argument map for PNG export.'
        );
      };

      // Start loading the SVG.
      img.src = svgUrl;
    } catch (error) {
      console.error(
        'PNG export failed:',
        error
      );

      alert(
        'PNG export failed. Please try again.'
      );
    }
  };

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="insight-panel mt-6">
      <div className="insight-title text-2xl font-bold mb-4">
        Argument insights
      </div>

      <div className="insight-grid grid grid-cols-4 gap-4 mb-6">
        {/* Unique Claims */}
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-blue-600 dark:text-blue-400">
            {graph.nodes.length}
          </strong>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Unique claims
          </span>
        </div>

        {/* Attacks */}
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-red-600 dark:text-red-400">
            {totals.attacks}
          </strong>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Attacks
          </span>
        </div>

        {/* Supports */}
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-green-600 dark:text-green-400">
            {totals.supports}
          </strong>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Supports
          </span>
        </div>

        {/* Confidence */}
        <div className="insight-stat bg-slate-100 dark:bg-slate-800 p-4 rounded text-center">
          <strong className="block text-2xl text-amber-600 dark:text-amber-400">
            {graph.meta?.confidence || 0}%
          </strong>

          <span className="text-sm text-slate-600 dark:text-slate-300">
            Confidence
          </span>
        </div>
      </div>

      <div className="insight-list space-y-4">
        {/* Most Contested */}
        {mostAttacked?.attack_count >
          0 && (
          <div className="insight-item border-l-4 border-red-500 pl-4 py-2">
            <span className="font-semibold block mb-1">
              Most contested
            </span>

            <div className="text-slate-700 dark:text-slate-200">
              <span className="italic">
                "
                {truncate(
                  mostAttacked.node.text,
                  82
                )}
                "
              </span>{' '}
              was attacked{' '}
              {
                mostAttacked.attack_count
              }{' '}
              time
              {mostAttacked.attack_count !==
              1
                ? 's'
                : ''}
              .
            </div>
          </div>
        )}

        {/* Most Supported */}
        {mostSupported?.support_count >
          0 && (
          <div className="insight-item border-l-4 border-green-500 pl-4 py-2">
            <span className="font-semibold block mb-1">
              Most supported
            </span>

            <div className="text-slate-700 dark:text-slate-200">
              <span className="italic">
                "
                {truncate(
                  mostSupported.node.text,
                  82
                )}
                "
              </span>{' '}
              was supported{' '}
              {
                mostSupported.support_count
              }{' '}
              time
              {mostSupported.support_count !==
              1
                ? 's'
                : ''}
              .
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="export-actions flex gap-4 mt-6">
          <button
            onClick={
              handleExportPNG
            }
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Export PNG
          </button>

          <button
            onClick={
              handleExportJSON
            }
            type="button"
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition"
          >
            Export JSON
          </button>

          <button
            onClick={
              handleCopySummary
            }
            type="button"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Copy Summary
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================
// TEXT TRUNCATION
// ===========================================================
function truncate(str, max) {
  if (!str) {
    return '';
  }

  return str.length > max
    ? `${str.slice(0, max)}...`   
    : str;
}
  
