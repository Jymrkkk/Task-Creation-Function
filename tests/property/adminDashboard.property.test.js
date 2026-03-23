/**
 * Property-based tests for Admin Dashboard
 * Feature: admin-dashboard
 */

// Feature: admin-dashboard, Property 1: Config round-trip
describe('Admin Dashboard Properties', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Feature: admin-dashboard, Property 6: Spreadsheet URL extraction
  // Validates: Requirements 3.5
  test('Property 6: extractSpreadsheetId should return only the ID portion from a full Google Sheets URL', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_-]{10,44}$/),
        (id) => {
          const url = `https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`;
          const result = ConfigStore.extractSpreadsheetId(url);
          expect(result).toBe(id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 3: Empty required fields are rejected
  // Validates: Requirements 2.4, 3.4, 6.3
  test('Property 3: requireNonEmpty should return valid === false for empty or whitespace-only strings', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom('', ' ', '   ', '\t', '\n'),
          fc.stringMatching(/^\s*$/)
        ),
        (v) => {
          expect(Validator.requireNonEmpty(v).valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 4: Web App URL prefix warning
  // Validates: Requirements 2.5
  test('Property 4: validateWebAppUrl should return a warning for URLs not starting with the expected prefix', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && !s.startsWith('https://script.google.com/macros/s/')),
        (value) => {
          const result = Validator.validateWebAppUrl(value);
          expect(result.warning).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 5: Discord webhook URL format warning
  // Validates: Requirements 4.4
  test('Property 5: validateDiscordWebhook should return a warning for strings not matching the Discord webhook pattern', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim() !== '' && !/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(s)),
        (value) => {
          const result = Validator.validateDiscordWebhook(value);
          expect(result.warning).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 1: Config round-trip
  // Validates: Requirements 2.2, 3.2, 4.2, 6.2
  test('Property 1: saveAll then getAll should return an object equal to the saved settings', () => {
    fc.assert(
      fc.property(
        fc.record({
          webAppUrl: fc.string(),
          spreadsheetId: fc.string(),
          webhooks: fc.record({
            'Marketing Team':    fc.string(),
            'Creatives Team':    fc.string(),
            'Development Team':  fc.string(),
            'Operations Team':   fc.string(),
            'Everyone':          fc.string(),
          }),
        }),
        (settings) => {
          const configStore = new ConfigStore();

          configStore.saveAll(settings);
          const result = configStore.getAll();

          expect(result.webAppUrl).toBe(settings.webAppUrl);
          expect(result.spreadsheetId).toBe(settings.spreadsheetId);
          expect(result.webhooks).toEqual(settings.webhooks);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 2: Config loads on startup
  // Validates: Requirements 2.3, 3.3, 4.3, 7.3
  test('Property 2: ConfigLoader.init() should apply the stored webAppUrl to both clients', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (url) => {
          const configStore = new ConfigStore();
          configStore.saveAll({ webAppUrl: url, spreadsheetId: '', webhooks: {} });

          const backendClient = { webAppUrl: '' };
          const dashboardClient = { webAppUrl: '' };

          new ConfigLoader(configStore, backendClient, dashboardClient).init();

          expect(backendClient.webAppUrl).toBe(url);
          expect(dashboardClient.webAppUrl).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 8: Fallback to defaults when no config stored
  // Validates: Requirements 7.2
  test('Property 8: ConfigLoader.init() should apply DEFAULTS.WEB_APP_URL when no config is stored', () => {
    // localStorage is already cleared by beforeEach
    const configStore = new ConfigStore();
    const backendClient = { webAppUrl: '' };
    const dashboardClient = { webAppUrl: '' };

    new ConfigLoader(configStore, backendClient, dashboardClient).init();

    expect(backendClient.webAppUrl).toBe(DEFAULTS.WEB_APP_URL);
    expect(dashboardClient.webAppUrl).toBe(DEFAULTS.WEB_APP_URL);
  });

  // Feature: admin-dashboard, Property 9: Reset clears all settings to defaults
  // Validates: Requirements 8.3
  test('Property 9: clear() then applyDefaults() should reset all fields to empty and clients to default URL', () => {
    fc.assert(
      fc.property(
        fc.record({
          webAppUrl: fc.string({ minLength: 1 }),
          spreadsheetId: fc.string(),
          webhooks: fc.record({
            'Marketing Team':    fc.string(),
            'Creatives Team':    fc.string(),
            'Development Team':  fc.string(),
            'Operations Team':   fc.string(),
            'Everyone':          fc.string(),
          }),
        }),
        (settings) => {
          const configStore = new ConfigStore();
          configStore.saveAll(settings);

          const backendClient = { webAppUrl: '' };
          const dashboardClient = { webAppUrl: '' };
          const configLoader = new ConfigLoader(configStore, backendClient, dashboardClient);

          configStore.clear();
          configLoader.applyDefaults();

          const result = configStore.getAll();
          expect(result.webAppUrl).toBe('');
          expect(result.spreadsheetId).toBe('');
          for (const team of Object.keys(result.webhooks)) {
            expect(result.webhooks[team]).toBe('');
          }
          expect(backendClient.webAppUrl).toBe(DEFAULTS.WEB_APP_URL);
          expect(dashboardClient.webAppUrl).toBe(DEFAULTS.WEB_APP_URL);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 10: Live apply new URL to clients
  // Validates: Requirements 6.4
  test('Property 10: applyUrl() should immediately update both clients with the new URL', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (url) => {
          const configStore = new ConfigStore();
          const backendClient = { webAppUrl: '' };
          const dashboardClient = { webAppUrl: '' };
          const configLoader = new ConfigLoader(configStore, backendClient, dashboardClient);

          configLoader.applyUrl(url);

          expect(backendClient.webAppUrl).toBe(url);
          expect(dashboardClient.webAppUrl).toBe(url);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 11: Dashboard displays stored values
  // Validates: Requirements 1.3
  test('Property 11: AdminDashboard.open() should populate each form input with the corresponding stored value', () => {
    // Set up required DOM elements
    document.body.innerHTML = `
      <div id="adminOverlay">
        <input id="adminWebAppUrl" />
        <input id="adminSpreadsheetId" />
        <input id="adminWebhook_Marketing_Team" />
        <input id="adminWebhook_Creatives_Team" />
        <input id="adminWebhook_Development_Team" />
        <input id="adminWebhook_Operations_Team" />
        <input id="adminWebhook_Everyone" />
        <ul id="adminStatusList"></ul>
      </div>
    `;

    fc.assert(
      fc.property(
        fc.record({
          webAppUrl: fc.string(),
          spreadsheetId: fc.string(),
          webhooks: fc.record({
            'Marketing Team':   fc.string(),
            'Creatives Team':   fc.string(),
            'Development Team': fc.string(),
            'Operations Team':  fc.string(),
            'Everyone':         fc.string(),
          }),
        }),
        (settings) => {
          const configStore = new ConfigStore();
          configStore.saveAll(settings);

          const adminDashboard = new AdminDashboard(configStore, {}, {});
          adminDashboard.open();

          expect(document.getElementById('adminWebAppUrl').value).toBe(settings.webAppUrl);
          expect(document.getElementById('adminSpreadsheetId').value).toBe(settings.spreadsheetId);
          expect(document.getElementById('adminWebhook_Marketing_Team').value).toBe(settings.webhooks['Marketing Team']);
          expect(document.getElementById('adminWebhook_Creatives_Team').value).toBe(settings.webhooks['Creatives Team']);
          expect(document.getElementById('adminWebhook_Development_Team').value).toBe(settings.webhooks['Development Team']);
          expect(document.getElementById('adminWebhook_Operations_Team').value).toBe(settings.webhooks['Operations Team']);
          expect(document.getElementById('adminWebhook_Everyone').value).toBe(settings.webhooks['Everyone']);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: admin-dashboard, Property 7: Unconfigured team status
  // Validates: Requirements 4.5, 5.3
  test('Property 7: _updateStatusSummary() should mark teams with empty webhooks as unconfigured', () => {
    // Set up required DOM elements
    document.body.innerHTML = `
      <div id="adminOverlay">
        <ul id="adminStatusList"></ul>
      </div>
    `;

    // Generate settings where at least one webhook is empty
    fc.assert(
      fc.property(
        fc.record({
          webAppUrl: fc.string(),
          spreadsheetId: fc.string(),
          webhooks: fc.record({
            'Marketing Team':   fc.constant(''),
            'Creatives Team':   fc.string(),
            'Development Team': fc.string(),
            'Operations Team':  fc.string(),
            'Everyone':         fc.string(),
          }),
        }),
        (settings) => {
          const configStore = new ConfigStore();
          const adminDashboard = new AdminDashboard(configStore, {}, {});
          adminDashboard._updateStatusSummary(settings);

          const list = document.getElementById('adminStatusList');
          const unconfiguredItems = list.querySelectorAll('.status-dot.unconfigured');
          expect(unconfiguredItems.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
