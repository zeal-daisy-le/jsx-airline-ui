const baseUrl = process.env.LHCI_BASE_URL || 'http://localhost:3000';

/** @type {import('@lhci/utils/src/lighthouserc').LighthouseRc} */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [baseUrl, `${baseUrl}/booking/flights`],
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 2,
          disabled: false,
        },
        // Simulate a mid-tier 4G mobile connection
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 4,
        },
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertions: {
        // Performance score ≥ 90 on mobile — hard block
        'categories:performance': ['error', { minScore: 0.9 }],
        // LCP ≤ 2.5 s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        // CLS ≤ 0.1
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      // Public temporary storage — links appear in the PR comment
      target: 'temporary-public-storage',
    },
  },
};
