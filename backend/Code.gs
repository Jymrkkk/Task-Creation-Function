/**
 * Google Apps Script Backend for Task Management System
 * 
 * This script receives task data from the web form and posts it to Discord.
 * It returns a JSON response with the Discord message ID and timestamp.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open Google Apps Script (script.google.com)
 * 2. Create a new project or open your existing one
 * 3. Replace the entire Code.gs content with this file
 * 4. Set up Script Properties:
 *    - Go to Project Settings > Script Properties
 *    - Add the following properties with your Discord webhook URLs:
 *      
 *      TEAM-SPECIFIC WEBHOOKS (for multi-channel routing):
 *      - DISCORD_WEBHOOK_MARKETING_TEAM = your_marketing_webhook_url
 *      - DISCORD_WEBHOOK_CREATIVES_TEAM = your_creatives_webhook_url
 *      - DISCORD_WEBHOOK_DEVELOPMENT_TEAM = your_development_webhook_url
 *      - DISCORD_WEBHOOK_OPERATIONS_TEAM = your_operations_webhook_url
 *      - DISCORD_WEBHOOK_EVERYONE = your_everyone_webhook_url
 *      
 *      BACKWARD COMPATIBILITY (legacy single-channel):
 *      - DISCORD_WEBHOOK_URL = your_discord_webhook_url (fallback for Everyone team)
 *      
 *    Note: The system will use team-specific webhooks when available. If only
 *    DISCORD_WEBHOOK_URL is configured, all tasks will route to that channel
 *    (legacy behavior).
 * 5. Deploy as Web App:
 *    - Click Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy
 * 6. Copy the Web App URL and update it in your index.html
 */

/**
 * Retrieves webhook URL for a specific team from Script Properties
 * @param {string} team - Team name (e.g., "Marketing Team", "Everyone")
 * @returns {string|null} Webhook URL or null if not configured
 */
function getWebhookUrl(team) {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Convert team name to property name format
  // Example: "Marketing Team" -> "DISCORD_WEBHOOK_MARKETING_TEAM"
  const propertyName = "DISCORD_WEBHOOK_" + team.toUpperCase().replace(/ /g, "_");
  
  // Try to get team-specific webhook
  let webhookUrl = scriptProperties.getProperty(propertyName);
  
  // Fallback to legacy DISCORD_WEBHOOK_URL for "Everyone" team
  if (!webhookUrl && team === "Everyone") {
    webhookUrl = scriptProperties.getProperty("DISCORD_WEBHOOK_URL");
    Logger.log("[WebhookManager] Using legacy DISCORD_WEBHOOK_URL for Everyone team");
  }
  
  if (webhookUrl) {
    Logger.log("[WebhookManager] Retrieved webhook for " + team + ": configured");
  } else {
    Logger.log("[WebhookManager] No webhook configured for " + team);
  }
  
  return webhookUrl;
}

/**
 * Retrieves all configured webhook URLs
 * @returns {Object} Map of team names to webhook URLs (only includes configured teams)
 */
function getAllWebhookUrls() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const teams = ["Marketing Team", "Creatives Team", "Development Team", "Operations Team", "Everyone"];
  const webhookMap = {};
  
  teams.forEach(function(team) {
    const webhookUrl = getWebhookUrl(team);
    if (webhookUrl) {
      webhookMap[team] = webhookUrl;
    }
  });
  
  Logger.log("[WebhookManager] Retrieved " + Object.keys(webhookMap).length + " configured webhooks");
  
  return webhookMap;
}

/**
 * Validates webhook configuration for a specific team
 * @param {string} team - Team name (e.g., "Marketing Team", "Everyone")
 * @returns {Object} Validation result with {valid: boolean, error: string|null}
 */
function validateWebhookConfig(team) {
  // Check if webhook URL exists for the team
  const webhookUrl = getWebhookUrl(team);
  
  if (!webhookUrl) {
    Logger.log("[WebhookManager] Validation failed: No webhook configured for " + team);
    return {
      valid: false,
      error: "Webhook URL not configured for team: " + team
    };
  }
  
  // Validate webhook URL format matches Discord pattern: webhooks/{id}/{token}
  const discordWebhookPattern = /webhooks\/(\d+)\/([^\/\?]+)/;
  
  if (!discordWebhookPattern.test(webhookUrl)) {
    Logger.log("[WebhookManager] Validation failed: Invalid webhook URL format for " + team);
    return {
      valid: false,
      error: "Webhook URL doesn't match expected Discord format (webhooks/{id}/{token}): " + team
    };
  }
  
  Logger.log("[WebhookManager] Validation passed for " + team);
  return {
    valid: true,
    error: null
  };
}

/**
 * Determines routing strategy for a task based on assignedTo and messageId
 * @param {Object} taskData - Task data including assignedTo and messageId
 * @returns {Object} Routing decision object with strategy, targetTeams, isUpdate, originalTeam, requiresNewMessage
 */
function determineRouting(taskData) {
  const assignedTo = taskData.assignedTo;
  const messageId = taskData.messageId;
  const allTeams = ["Marketing Team", "Creatives Team", "Development Team", "Operations Team", "Everyone"];
  
  // Determine if this is an update (has messageId) or new task (no messageId)
  const isUpdate = !!messageId;
  
  // NEW TASK (no messageId)
  if (!isUpdate) {
    if (assignedTo === "Everyone") {
      // Broadcast to all channels
      Logger.log("[TaskRouter] Routing strategy: broadcast (new task), targets: all teams");
      return {
        strategy: "broadcast",
        targetTeams: allTeams,
        isUpdate: false,
        originalTeam: null,
        requiresNewMessage: true
      };
    } else {
      // Single channel routing
      Logger.log("[TaskRouter] Routing strategy: single (new task), target: " + assignedTo);
      return {
        strategy: "single",
        targetTeams: [assignedTo],
        isUpdate: false,
        originalTeam: null,
        requiresNewMessage: true
      };
    }
  }
  
  // TASK UPDATE (has messageId)
  
  // Check if messageId is an array (indicates "Everyone" task update)
  const isMessageIdArray = Array.isArray(messageId);
  
  if (isMessageIdArray) {
    // This is an "Everyone" task update
    if (assignedTo === "Everyone") {
      // Update all channels (broadcast update)
      Logger.log("[TaskRouter] Routing strategy: broadcast (update), targets: all teams");
      return {
        strategy: "broadcast",
        targetTeams: allTeams,
        isUpdate: true,
        originalTeam: null,
        requiresNewMessage: false
      };
    } else {
      // Changed from "Everyone" to specific team (cross-channel)
      Logger.log("[TaskRouter] Cross-channel update detected: Everyone -> " + assignedTo);
      return {
        strategy: "cross-channel",
        targetTeams: [assignedTo],
        isUpdate: true,
        originalTeam: "Everyone",
        requiresNewMessage: true
      };
    }
  } else {
    // Single messageId (string) - was a team-specific task
    if (assignedTo === "Everyone") {
      // Changed from specific team to "Everyone" (cross-channel broadcast)
      Logger.log("[TaskRouter] Cross-channel update detected: specific team -> Everyone");
      return {
        strategy: "cross-channel",
        targetTeams: allTeams,
        isUpdate: true,
        originalTeam: taskData.originalAssignedTo || null,
        requiresNewMessage: true
      };
    } else {
      // Team-specific update - check if team changed
      const originalTeam = taskData.originalAssignedTo;
      
      if (originalTeam && originalTeam !== assignedTo) {
        // Team changed - this is a cross-channel update
        Logger.log("[TaskRouter] Cross-channel update detected: " + originalTeam + " -> " + assignedTo);
        return {
          strategy: "cross-channel",
          targetTeams: [assignedTo],
          isUpdate: true,
          originalTeam: originalTeam,
          requiresNewMessage: true
        };
      }
      
      // Same team - regular update
      Logger.log("[TaskRouter] Routing strategy: single (update), target: " + assignedTo);
      return {
        strategy: "single",
        targetTeams: [assignedTo],
        isUpdate: true,
        originalTeam: null,
        requiresNewMessage: false
      };
    }
  }
}

/**
 * Handles GET requests for fetching Dashboard data
 * @param {Object} e - The event object containing the request data
 * @returns {TextOutput} JSON response with Dashboard data
 */
function doGet(e) {
  try {
    // Get the action parameter (default to 'getDashboard')
    const action = e.parameter.action || 'getDashboard';
    
    if (action === 'getDashboard') {
      return getDashboardData();
    } else {
      return createErrorResponse("Invalid action", "Unknown action: " + action);
    }
  } catch (error) {
    Logger.log("[doGet] Error: " + error.toString());
    return createErrorResponse("Server error", "Failed to fetch dashboard data: " + error.message);
  }
}

/**
 * Saves task data to the Dashboard sheet
 * @param {Object} taskData - Task data to save
 * @param {string|Array<string>} messageId - Discord message ID(s) (new)
 * @param {string|Array<string>} oldMessageId - Previous Discord message ID(s) for searching (optional)
 * @returns {boolean} Success status
 */
function saveTaskToSheet(taskData, messageId, oldMessageId) {
  try {
    Logger.log("[saveTaskToSheet] Saving task to Dashboard sheet");
    
    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!spreadsheet) {
      Logger.log("[saveTaskToSheet] No active spreadsheet found");
      return false;
    }
    
    // Get or create the Dashboard sheet
    let sheet = spreadsheet.getSheetByName("Dashboard");
    
    if (!sheet) {
      Logger.log("[saveTaskToSheet] Dashboard sheet not found, creating it");
      sheet = spreadsheet.insertSheet("Dashboard");
      
      // Add headers
      const headers = ["Timestamp", "Task Name", "Description", "Priority", "Requester", "Assigned To", "Status", "messageId"];
      sheet.appendRow(headers);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#6a0dad");
      headerRange.setFontColor("#ffffff");
    }
    
    // Check if this is an update (task has messageId from previous submission OR oldMessageId provided)
    const isUpdate = taskData.messageId || oldMessageId;
    
    if (isUpdate) {
      // Try to find and update existing row
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      
      // Determine which messageId to search for
      // Priority: oldMessageId (for cross-channel) > taskData.messageId (for same-channel)
      const searchMessageId = oldMessageId || taskData.messageId;
      const searchId = Array.isArray(searchMessageId) ? searchMessageId[0] : searchMessageId;
      
      // Convert to string for comparison
      const searchIdStr = String(searchId).trim();
      
      Logger.log("[saveTaskToSheet] Searching for existing row with messageId: '" + searchIdStr + "'");
      Logger.log("[saveTaskToSheet] isUpdate: " + isUpdate + ", oldMessageId: " + oldMessageId + ", taskData.messageId: " + taskData.messageId);
      
      // Find row with matching messageId
      let rowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        const rowMessageId = values[i][7]; // messageId column (H)
        const rowMessageIdStr = String(rowMessageId).trim();
        
        // Log each comparison for debugging
        Logger.log("[saveTaskToSheet] Row " + (i + 1) + " messageId: '" + rowMessageIdStr + "' vs search: '" + searchIdStr + "'");
        
        // Try exact match first
        if (rowMessageIdStr === searchIdStr) {
          rowIndex = i + 1;
          Logger.log("[saveTaskToSheet] Found exact match at row " + rowIndex);
          break;
        }
        
        // Try partial match for comma-separated messageIds (Everyone tasks)
        if (rowMessageIdStr.includes(',')) {
          const rowIds = rowMessageIdStr.split(',').map(id => id.trim());
          if (rowIds.includes(searchIdStr)) {
            rowIndex = i + 1;
            Logger.log("[saveTaskToSheet] Found partial match at row " + rowIndex);
            break;
          }
        }
      }
      
      // Fallback: If messageId search failed, try searching by Task Name + Requester
      // BUT: Only use this fallback if we have an oldMessageId (cross-channel update)
      // For same-channel updates, if messageId search fails, something is wrong
      if (rowIndex === -1 && oldMessageId && taskData.taskName && taskData.user) {
        Logger.log("[saveTaskToSheet] MessageId search failed for cross-channel update, trying Task Name + Requester fallback");
        for (let i = 1; i < values.length; i++) {
          const rowTaskName = String(values[i][1]).trim(); // Task Name column (B)
          const rowRequester = String(values[i][4]).trim(); // Requester column (E)
          
          if (rowTaskName === taskData.taskName && rowRequester === taskData.user) {
            rowIndex = i + 1;
            Logger.log("[saveTaskToSheet] Found match by Task Name + Requester at row " + rowIndex);
            break;
          }
        }
      }
      
      // If still not found and this is an update, log warning
      if (rowIndex === -1 && isUpdate) {
        Logger.log("[saveTaskToSheet] WARNING: Could not find existing row for update. SearchId: " + searchIdStr + ", TaskName: " + taskData.taskName + ", User: " + taskData.user);
      }
      
      if (rowIndex > 0) {
        // Update existing row
        Logger.log("[saveTaskToSheet] Updating existing row " + rowIndex);
        
        const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM dd, yyyy 'at' hh:mm a");
        const row = [
          timestamp,
          taskData.taskName,
          taskData.description || "",
          taskData.priority,
          taskData.user,
          taskData.assignedTo,
          "In Progress", // Default status
          "'" + (Array.isArray(messageId) ? messageId.join(",") : messageId) // Prefix with ' to force string
        ];
        
        sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
        Logger.log("[saveTaskToSheet] Task updated successfully in row " + rowIndex);
        return true;
      } else {
        Logger.log("[saveTaskToSheet] No existing row found with messageId: " + searchId);
      }
    }
    
    // If not an update or row not found, append new row
    Logger.log("[saveTaskToSheet] Appending new row");
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM dd, yyyy 'at' hh:mm a");
    const row = [
      timestamp,
      taskData.taskName,
      taskData.description || "",
      taskData.priority,
      taskData.user,
      taskData.assignedTo,
      "In Progress", // Default status
      "'" + (Array.isArray(messageId) ? messageId.join(",") : messageId) // Prefix with ' to force string
    ];
    
    sheet.appendRow(row);
    Logger.log("[saveTaskToSheet] Task saved successfully as new row");
    
    return true;
    
  } catch (error) {
    Logger.log("[saveTaskToSheet] Error: " + error.toString());
    return false;
  }
}

/**
 * Fetches data from the Dashboard sheet
 * @returns {TextOutput} JSON response with dashboard data
 */
function getDashboardData() {
  try {
    Logger.log("[getDashboardData] Fetching Dashboard sheet data");
    
    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!spreadsheet) {
      Logger.log("[getDashboardData] No active spreadsheet found");
      return createErrorResponse("Configuration error", "No spreadsheet is bound to this script. Please bind a spreadsheet.");
    }
    
    // Get the Dashboard sheet
    const sheet = spreadsheet.getSheetByName("Dashboard");
    
    if (!sheet) {
      Logger.log("[getDashboardData] Dashboard sheet not found");
      return createErrorResponse("Configuration error", "Dashboard sheet not found in the spreadsheet.");
    }
    
    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length === 0) {
      Logger.log("[getDashboardData] Dashboard sheet is empty");
      return createSuccessResponseWithData([]);
    }
    
    // Assume first row is headers
    const headers = values[0];
    const rows = values.slice(1);
    
    // Convert to array of objects
    const data = rows.map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    
    Logger.log("[getDashboardData] Successfully fetched " + data.length + " rows from Dashboard");
    
    return createSuccessResponseWithData(data);
    
  } catch (error) {
    Logger.log("[getDashboardData] Error: " + error.toString());
    throw error;
  }
}

/**
 * Creates a success JSON response with data
 * @param {Array} data - The data to return
 * @returns {TextOutput} JSON response
 */
function createSuccessResponseWithData(data) {
  const response = {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles POST requests from the web form
 * @param {Object} e - The event object containing the request data
 * @returns {TextOutput} JSON response with success status, messageId, and timestamp
 */
function doPost(e) {
  try {
    // Parse incoming request
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      Logger.log("[doPost] JSON parse error: " + parseError.toString());
      return createErrorResponse("Invalid request", "Request body must be valid JSON: " + parseError.message);
    }

    // Handle completeTask action separately
    if (requestData.action === 'completeTask') {
      return handleCompleteTask(requestData);
    }
    
    // Validate required fields
    if (!requestData.taskName || !requestData.user || !requestData.assignedTo) {
      const missingFields = [];
      if (!requestData.taskName) missingFields.push("taskName");
      if (!requestData.user) missingFields.push("user");
      if (!requestData.assignedTo) missingFields.push("assignedTo");
      
      Logger.log("[doPost] Validation error: Missing required fields: " + missingFields.join(", "));
      return createErrorResponse("Invalid request", "Missing required fields: " + missingFields.join(", "));
    }
    
    Logger.log("[doPost] Processing task: " + requestData.taskName + ", assignedTo: " + requestData.assignedTo);
    Logger.log("[doPost] Request messageId: " + requestData.messageId);
    Logger.log("[doPost] Request originalAssignedTo: " + requestData.originalAssignedTo);
    
    // Determine routing strategy
    const routing = determineRouting(requestData);
    Logger.log("[doPost] Routing decision: strategy=" + routing.strategy + ", targetTeams=" + routing.targetTeams.join(","));
    
    // Validate webhook configuration for target teams
    const validationErrors = [];
    routing.targetTeams.forEach(function(team) {
      const validation = validateWebhookConfig(team);
      if (!validation.valid) {
        validationErrors.push(validation.error);
      }
    });
    
    // If any validation errors, return configuration error
    if (validationErrors.length > 0) {
      Logger.log("[doPost] Configuration validation failed: " + validationErrors.join("; "));
      return createErrorResponse("Configuration error", validationErrors.join("; "));
    }
    
    // Handle routing based on strategy
    let discordResponse;
    
    if (routing.strategy === "single") {
      // Single channel routing (new task or same-channel update)
      const targetTeam = routing.targetTeams[0];
      const webhookUrl = getWebhookUrl(targetTeam);
      
      // Create embed (no cross-channel options needed)
      const embed = createDiscordEmbed(requestData);
      
      if (routing.isUpdate && !routing.requiresNewMessage) {
        // Update existing message in same channel
        Logger.log("[doPost] Updating existing message in " + targetTeam);
        discordResponse = updateDiscordMessage(webhookUrl, requestData.messageId, embed);
      } else {
        // Create new message
        Logger.log("[doPost] Creating new message in " + targetTeam);
        discordResponse = sendToDiscord(webhookUrl, embed);
      }
      
    } else if (routing.strategy === "broadcast") {
      // Broadcast to all channels
      const webhookUrls = routing.targetTeams.map(function(team) {
        return getWebhookUrl(team);
      });
      
      // Create embed (no cross-channel options needed for broadcast)
      const embed = createDiscordEmbed(requestData);
      
      if (routing.isUpdate && !routing.requiresNewMessage) {
        // Update existing messages in all channels
        Logger.log("[doPost] Updating broadcast messages in " + routing.targetTeams.length + " channels");
        
        // Build updates array with webhookUrl and messageId pairs
        const updates = routing.targetTeams.map(function(team, index) {
          return {
            webhookUrl: getWebhookUrl(team),
            messageId: requestData.messageId[index]
          };
        });
        
        const result = updateBroadcastMessages(updates, embed);
        
        // Handle partial failures
        if (result.errors.length > 0) {
          Logger.log("[doPost] Broadcast update completed with " + result.errors.length + " errors");
          // Return success with errors array
          return createBroadcastResponseWithErrors(result.messageIds, result.errors);
        }
        
        discordResponse = { messageId: result.messageIds };
        
      } else {
        // Create new messages in all channels
        Logger.log("[doPost] Broadcasting new message to " + routing.targetTeams.length + " channels");
        
        const result = broadcastToDiscord(webhookUrls, embed);
        
        // Handle partial failures
        if (result.errors.length > 0) {
          Logger.log("[doPost] Broadcast completed with " + result.errors.length + " errors");
          // Return success with errors array
          return createBroadcastResponseWithErrors(result.messageIds, result.errors);
        }
        
        discordResponse = { messageId: result.messageIds };
      }
      
    } else if (routing.strategy === "cross-channel") {
      // Cross-channel update: create new message in new channel
      const targetTeam = routing.targetTeams[0];
      const webhookUrl = getWebhookUrl(targetTeam);
      
      Logger.log("[doPost] Cross-channel update: creating new message in " + targetTeam);
      if (routing.originalTeam) {
        Logger.log("[doPost] Original team: " + routing.originalTeam);
      }
      
      // Create embed with cross-channel indicator
      const embedOptions = {
        isCrossChannel: true,
        originalTeam: routing.originalTeam
      };
      const embed = createDiscordEmbed(requestData, embedOptions);
      
      // For cross-channel from Everyone to specific team, broadcast to all
      if (routing.targetTeams.length > 1) {
        // This is cross-channel from specific team to Everyone
        const webhookUrls = routing.targetTeams.map(function(team) {
          return getWebhookUrl(team);
        });
        
        const result = broadcastToDiscord(webhookUrls, embed);
        
        // Handle partial failures
        if (result.errors.length > 0) {
          Logger.log("[doPost] Cross-channel broadcast completed with " + result.errors.length + " errors");
          return createBroadcastResponseWithErrors(result.messageIds, result.errors);
        }
        
        discordResponse = { messageId: result.messageIds };
      } else {
        // Single channel cross-channel update
        discordResponse = sendToDiscord(webhookUrl, embed);
      }
    }
    
    // Save to Google Sheets
    try {
      Logger.log("[doPost] Saving task to Google Sheets");
      
      // For cross-channel updates, pass the old messageId for searching
      const oldMessageId = (routing.strategy === "cross-channel" && requestData.messageId) 
        ? requestData.messageId 
        : null;
      
      Logger.log("[doPost] Routing strategy: " + routing.strategy);
      Logger.log("[doPost] Old messageId for search: " + oldMessageId);
      Logger.log("[doPost] New messageId to save: " + discordResponse.messageId);
      
      const saved = saveTaskToSheet(requestData, discordResponse.messageId, oldMessageId);
      if (saved) {
        Logger.log("[doPost] Task saved to Google Sheets successfully");
      } else {
        Logger.log("[doPost] Warning: Failed to save task to Google Sheets");
      }
    } catch (sheetError) {
      // Don't fail the whole request if Sheets save fails
      Logger.log("[doPost] Warning: Error saving to Sheets: " + sheetError.toString());
    }
    
    // Return success response with messageId and timestamp
    Logger.log("[doPost] Task processed successfully");
    return createSuccessResponse(discordResponse.messageId);
    
  } catch (error) {
    Logger.log("[doPost] Error: " + error.toString());
    
    // Handle specific error types
    const errorMessage = error.toString();
    
    // Discord message not found (404)
    if (errorMessage.includes("Message not found")) {
      return createErrorResponse("Message not found", "The Discord message could not be found. It may have been deleted or the message ID is invalid.");
    }
    
    // Discord API errors (4xx, 5xx)
    if (errorMessage.includes("Discord API error")) {
      // Extract more details if available
      if (errorMessage.includes("429")) {
        return createErrorResponse("Discord API error", "Rate limit exceeded. Please try again in a few moments.");
      } else if (errorMessage.includes("5")) {
        // 5xx server errors
        return createErrorResponse("Discord API error", "Discord server error. Please try again later.");
      } else {
        return createErrorResponse("Discord API error", "Discord API request failed: " + errorMessage);
      }
    }
    
    // Configuration errors
    if (errorMessage.includes("Configuration error") || errorMessage.includes("Webhook URL not configured")) {
      return createErrorResponse("Configuration error", errorMessage);
    }
    
    // Invalid webhook format
    if (errorMessage.includes("Invalid webhook URL format")) {
      return createErrorResponse("Configuration error", "Invalid webhook URL format. Please check Script Properties configuration.");
    }
    
    // Network/timeout errors
    if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
      return createErrorResponse("Network error", "Network request failed or timed out. Please try again.");
    }
    
    // Generic server error for all other cases
    Logger.log("[doPost] Unhandled error type: " + errorMessage);
    return createErrorResponse("Server error", "An unexpected error occurred: " + errorMessage);
  }
}

/**
 * Handles task completion: updates sheet status to Done and notifies Discord
 */
function handleCompleteTask(requestData) {
  try {
    Logger.log("[handleCompleteTask] Marking task as done: " + requestData.taskName);

    // Update sheet status to Done
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet && spreadsheet.getSheetByName("Dashboard");
    if (sheet) {
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      const searchId = Array.isArray(requestData.messageId) ? requestData.messageId[0] : requestData.messageId;
      const searchIdStr = String(searchId).trim();

      for (let i = 1; i < values.length; i++) {
        const rowMsgId = String(values[i][7]).trim();
        if (rowMsgId === searchIdStr || rowMsgId.includes(searchIdStr)) {
          sheet.getRange(i + 1, 7).setValue("Done"); // Status column
          Logger.log("[handleCompleteTask] Updated row " + (i + 1) + " status to Done");
          break;
        }
      }
    }

    // Build completion Discord message
    const completionNote = requestData.completionMessage
      ? "\n\n💬 **Message:** " + requestData.completionMessage
      : "";

    const body = [
      "✅ **Task Completed!**",
      "",
      "📝 **Task:** " + requestData.taskName,
      "📄 **Description:** " + (requestData.description || ""),
      "",
      "👤 **Requested By:** " + requestData.user,
      "👥 **Assigned To:** " + requestData.assignedTo,
      "📊 **Status:** Done" + completionNote
    ].join("\n");

    const embed = {
      username: "Task Bot (" + requestData.assignedTo + ")",
      content: body
    };

    // Send to the relevant webhook(s)
    const routing = determineRouting({ assignedTo: requestData.assignedTo, messageId: null });
    routing.targetTeams.forEach(function(team) {
      const webhookUrl = getWebhookUrl(team);
      if (webhookUrl) {
        try { sendToDiscord(webhookUrl, embed); } catch(e) {
          Logger.log("[handleCompleteTask] Failed to notify " + team + ": " + e.toString());
        }
      }
    });

    return createSuccessResponse(requestData.messageId);
  } catch (error) {
    Logger.log("[handleCompleteTask] Error: " + error.toString());
    return createErrorResponse("Server error", error.message);
  }
}

/**
 * Creates a Discord embed object from task data
 * @param {Object} taskData - The task data from the form
 * @param {Object} options - Optional parameters (isCrossChannel, originalTeam)
 * @returns {Object} Discord embed object
 */
function createDiscordEmbed(taskData, options) {
  const isUpdate = !!taskData.messageId;
  const header = isUpdate ? "📝 **Task Updated**" : "📌 **New Task Created**";

  // Priority emoji
  const priorityEmoji = taskData.priority === "High" ? "🔴" : taskData.priority === "Medium" ? "⚡" : "🟢";

  // Build reassignment note if needed
  let reassignNote = "";
  if (options && options.isCrossChannel && options.originalTeam) {
    reassignNote = "\n⚠️ **Reassigned from:** " + options.originalTeam;
  }

  const body = [
    header,
    "",
    "📝 **Task:** " + taskData.taskName,
    "📄 **Description:** " + (taskData.description || "No description provided"),
    "",
    priorityEmoji + " **Priority:** " + taskData.priority,
    "👤 **Requested By:** " + taskData.user,
    "👥 **Assigned To:** " + taskData.assignedTo,
    "📊 **Status:** In Progress" + reassignNote
  ].join("\n");

  return {
    username: "Task Bot (" + taskData.assignedTo + ")",
    content: body
  };
}

/**
 * Sends the embed to Discord and retrieves the message ID
 * @param {string} webhookUrl - The Discord webhook URL
 * @param {Object} embed - The Discord embed object
 * @returns {Object} Object containing the messageId
 */
function sendToDiscord(webhookUrl, embed) {
  Logger.log("[DiscordNotifier] Sending new message to Discord");
  
  // Add wait=true parameter to get the message object back
  const urlWithWait = webhookUrl + "?wait=true";
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(embed),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(urlWithWait, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // Handle different HTTP status codes
    if (responseCode === 404) {
      Logger.log("[DiscordNotifier] Discord API error 404: Webhook not found");
      throw new Error("Discord API error: Webhook not found (404). Please verify the webhook URL is correct.");
    }
    
    if (responseCode === 429) {
      Logger.log("[DiscordNotifier] Discord API error 429: Rate limit exceeded");
      throw new Error("Discord API error: Rate limit exceeded (429). Please try again later.");
    }
    
    if (responseCode >= 500) {
      Logger.log("[DiscordNotifier] Discord API error " + responseCode + ": Server error - " + responseText);
      throw new Error("Discord API error: Discord server error (" + responseCode + "). Please try again later.");
    }
    
    if (responseCode !== 200) {
      Logger.log("[DiscordNotifier] Discord API error " + responseCode + ": " + responseText);
      throw new Error("Discord API error: Request failed with status " + responseCode + " - " + responseText);
    }
    
    // Parse Discord response to get message ID
    let discordData;
    try {
      discordData = JSON.parse(responseText);
    } catch (parseError) {
      Logger.log("[DiscordNotifier] Failed to parse Discord response: " + parseError.toString());
      throw new Error("Discord API error: Invalid response format from Discord");
    }
    
    if (!discordData.id) {
      Logger.log("[DiscordNotifier] Discord response missing message ID");
      throw new Error("Discord API error: Response missing message ID");
    }
    
    Logger.log("[DiscordNotifier] Message sent successfully, messageId: " + discordData.id);
    
    return {
      messageId: discordData.id
    };
  } catch (error) {
    // Re-throw with context if it's not already a Discord API error
    if (!error.toString().includes("Discord API error")) {
      Logger.log("[DiscordNotifier] Network or unexpected error: " + error.toString());
      throw new Error("Discord API error: Network request failed - " + error.message);
    }
    throw error;
  }
}

/**
 * Broadcasts a message to multiple Discord channels
 * @param {Array<string>} webhookUrls - Array of Discord webhook URLs
 * @param {Object} embed - The Discord embed object
 * @returns {Object} Object containing {messageIds: Array<string>, errors: Array<Object>}
 */
function broadcastToDiscord(webhookUrls, embed) {
  Logger.log("[DiscordNotifier] Broadcasting message to " + webhookUrls.length + " channels");
  
  const messageIds = [];
  const errors = [];
  
  // Validate input
  if (!webhookUrls || webhookUrls.length === 0) {
    Logger.log("[DiscordNotifier] Broadcast error: No webhook URLs provided");
    throw new Error("Configuration error: No webhook URLs provided for broadcast");
  }
  
  // Process each webhook URL sequentially
  webhookUrls.forEach(function(webhookUrl, index) {
    try {
      // Validate webhook URL
      if (!webhookUrl) {
        throw new Error("Webhook URL is null or undefined");
      }
      
      // Send message to this channel
      const result = sendToDiscord(webhookUrl, embed);
      messageIds.push(result.messageId);
      Logger.log("[DiscordNotifier] Broadcast success for channel " + (index + 1) + "/" + webhookUrls.length);
    } catch (error) {
      // Collect error but continue processing other channels
      const errorObj = {
        channel: index + 1,
        webhookUrl: webhookUrl ? webhookUrl.substring(0, 50) + "..." : "null", // Truncate for security
        error: error.toString()
      };
      errors.push(errorObj);
      Logger.log("[DiscordNotifier] Broadcast failed for channel " + (index + 1) + "/" + webhookUrls.length + ": " + error.toString());
    }
  });
  
  Logger.log("[DiscordNotifier] Broadcast complete: " + messageIds.length + " succeeded, " + errors.length + " failed");
  
  // If all channels failed, throw an error
  if (messageIds.length === 0 && errors.length > 0) {
    Logger.log("[DiscordNotifier] All broadcast channels failed");
    throw new Error("Discord API error: All broadcast channels failed. First error: " + errors[0].error);
  }
  
  return {
    messageIds: messageIds,
    errors: errors
  };
}

/**
 * Updates messages in multiple Discord channels
 * @param {Array<Object>} updates - Array of {webhookUrl, messageId} objects
 * @param {Object} embed - The Discord embed object
 * @returns {Object} Object containing {messageIds: Array<string>, errors: Array<Object>}
 */
function updateBroadcastMessages(updates, embed) {
  Logger.log("[DiscordNotifier] Updating messages in " + updates.length + " channels");
  
  const messageIds = [];
  const errors = [];
  
  // Validate input
  if (!updates || updates.length === 0) {
    Logger.log("[DiscordNotifier] Update error: No updates provided");
    throw new Error("Configuration error: No updates provided for broadcast update");
  }
  
  // Process each update sequentially
  updates.forEach(function(update, index) {
    try {
      // Validate update object
      if (!update.webhookUrl) {
        throw new Error("Webhook URL is null or undefined");
      }
      if (!update.messageId) {
        throw new Error("Message ID is null or undefined");
      }
      
      // Update message in this channel
      const result = updateDiscordMessage(update.webhookUrl, update.messageId, embed);
      messageIds.push(result.messageId);
      Logger.log("[DiscordNotifier] Update success for channel " + (index + 1) + "/" + updates.length);
    } catch (error) {
      // Collect error but continue processing other channels
      const errorObj = {
        channel: index + 1,
        webhookUrl: update.webhookUrl ? update.webhookUrl.substring(0, 50) + "..." : "null", // Truncate for security
        messageId: update.messageId || "null",
        error: error.toString()
      };
      errors.push(errorObj);
      Logger.log("[DiscordNotifier] Update failed for channel " + (index + 1) + "/" + updates.length + ": " + error.toString());
    }
  });
  
  Logger.log("[DiscordNotifier] Update complete: " + messageIds.length + " succeeded, " + errors.length + " failed");
  
  // If all channels failed, throw an error
  if (messageIds.length === 0 && errors.length > 0) {
    Logger.log("[DiscordNotifier] All broadcast updates failed");
    throw new Error("Discord API error: All broadcast updates failed. First error: " + errors[0].error);
  }
  
  return {
    messageIds: messageIds,
    errors: errors
  };
}

/**
 * Updates an existing Discord message using PATCH endpoint
 * @param {string} webhookUrl - The Discord webhook URL
 * @param {string} messageId - The Discord message ID to update
 * @param {Object} embed - The Discord embed object
 * @returns {Object} Object containing the messageId
 */
function updateDiscordMessage(webhookUrl, messageId, embed) {
  Logger.log("[DiscordNotifier] Updating message: " + messageId);
  
  // Extract channel ID and webhook token from webhook URL
  // Webhook URL format: https://discord.com/api/webhooks/{webhook.id}/{webhook.token}
  const webhookParts = webhookUrl.match(/webhooks\/(\d+)\/([^\/\?]+)/);
  
  if (!webhookParts) {
    Logger.log("[DiscordNotifier] Invalid webhook URL format: " + webhookUrl);
    throw new Error("Invalid webhook URL format");
  }
  
  const webhookId = webhookParts[1];
  const webhookToken = webhookParts[2];
  
  // Construct PATCH URL for editing message
  const patchUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}/messages/${messageId}`;
  
  const options = {
    method: "patch",
    contentType: "application/json",
    payload: JSON.stringify(embed),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(patchUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // Handle different HTTP status codes
    if (responseCode === 404) {
      Logger.log("[DiscordNotifier] Message not found: " + messageId);
      throw new Error("Message not found");
    }
    
    if (responseCode === 429) {
      Logger.log("[DiscordNotifier] Discord API error 429: Rate limit exceeded");
      throw new Error("Discord API error: Rate limit exceeded (429). Please try again later.");
    }
    
    if (responseCode >= 500) {
      Logger.log("[DiscordNotifier] Discord API error " + responseCode + ": Server error - " + responseText);
      throw new Error("Discord API error: Discord server error (" + responseCode + "). Please try again later.");
    }
    
    if (responseCode !== 200) {
      Logger.log("[DiscordNotifier] Discord API error " + responseCode + ": " + responseText);
      throw new Error("Discord API error: Request failed with status " + responseCode + " - " + responseText);
    }
    
    Logger.log("[DiscordNotifier] Message updated successfully: " + messageId);
    
    // Return the same messageId since we're updating
    return {
      messageId: messageId
    };
  } catch (error) {
    // Re-throw with context if it's not already a known error
    if (!error.toString().includes("Discord API error") && !error.toString().includes("Message not found")) {
      Logger.log("[DiscordNotifier] Network or unexpected error: " + error.toString());
      throw new Error("Discord API error: Network request failed - " + error.message);
    }
    throw error;
  }
}

/**
 * Creates a success JSON response
 * @param {string|Array<string>} messageId - The Discord message ID (string for single, array for broadcast)
 * @returns {TextOutput} JSON response
 */
function createSuccessResponse(messageId) {
  const response = {
    success: true,
    messageId: messageId,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates a success JSON response with partial broadcast errors
 * @param {Array<string>} messageIds - Array of successful message IDs
 * @param {Array<Object>} errors - Array of error objects
 * @returns {TextOutput} JSON response
 */
function createBroadcastResponseWithErrors(messageIds, errors) {
  const response = {
    success: true,
    messageId: messageIds,
    timestamp: new Date().toISOString(),
    errors: errors
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates an error JSON response
 * @param {string} error - The error type
 * @param {string} details - Detailed error message
 * @returns {TextOutput} JSON response
 */
function createErrorResponse(error, details) {
  const response = {
    success: false,
    error: error,
    details: details
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
