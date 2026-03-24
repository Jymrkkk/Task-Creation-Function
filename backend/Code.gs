/**
 * Task Manager - Google Apps Script Backend
 * 
 * DEPLOYMENT: Deploy > New deployment > Web app
 *   Execute as: Me | Who has access: Anyone
 * 
 * After deploying, copy the Web App URL into Admin Settings on the page.
 */

// ─── GET: Dashboard data ──────────────────────────────────────────────────────

function doGet(e) {
  try {
    return getDashboardData();
  } catch (error) {
    return createErrorResponse("Server error", error.message);
  }
}

function getDashboardData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) return createErrorResponse("Configuration error", "No spreadsheet bound to this script.");

  const sheet = spreadsheet.getSheetByName("Dashboard");
  if (!sheet) return createErrorResponse("Configuration error", "Dashboard sheet not found.");

  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return createSuccessResponseWithData([]);

  const headers = values[0];
  const data = values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });

  return createSuccessResponseWithData(data);
}

// ─── POST: Create/update task or complete task ────────────────────────────────

function doPost(e) {
  try {
    var requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (err) {
      return createErrorResponse("Invalid request", "Body must be valid JSON: " + err.message);
    }

    if (requestData.action === 'completeTask') {
      return handleCompleteTask(requestData);
    }

    // Validate required fields
    if (!requestData.taskName || !requestData.user || !requestData.assignedTo) {
      return createErrorResponse("Invalid request", "Missing required fields: taskName, user, assignedTo");
    }

    Logger.log("[doPost] Task: " + requestData.taskName + " | assignedTo: " + requestData.assignedTo);

    // Build webhook entries from the webhookUrls array sent by the frontend
    var webhookEntries = requestData.webhookUrls || [];

    // Fallback: single webhookUrl field
    if (!webhookEntries.length && requestData.webhookUrl) {
      webhookEntries = [{ name: requestData.assignedTo, url: requestData.webhookUrl }];
    }

    // Filter out any entries missing a URL
    webhookEntries = webhookEntries.filter(function(e) { return e && e.url; });

    if (!webhookEntries.length) {
      Logger.log("[doPost] No valid webhook entries. webhookUrls=" + JSON.stringify(requestData.webhookUrls));
      return createErrorResponse("Configuration error", "No webhook URL provided. Please check Admin Settings.");
    }

    var embed = buildDiscordMessage(requestData);
    var allMessageIds = [];

    for (var i = 0; i < webhookEntries.length; i++) {
      var entry = webhookEntries[i];
      try {
        var resp;
        if (requestData.messageId && !Array.isArray(requestData.messageId)) {
          try {
            resp = updateDiscordMessage(entry.url, requestData.messageId, embed);
          } catch (updateErr) {
            Logger.log("[doPost] Update failed, sending new: " + updateErr.toString());
            resp = sendToDiscord(entry.url, embed);
          }
        } else {
          resp = sendToDiscord(entry.url, embed);
        }
        allMessageIds.push(resp.messageId);
        Logger.log("[doPost] Sent to " + entry.name + ": " + resp.messageId);
      } catch (sendErr) {
        Logger.log("[doPost] Failed to send to " + entry.name + ": " + sendErr.toString());
      }
    }

    if (!allMessageIds.length) {
      return createErrorResponse("Discord API error", "Failed to send to all selected channels.");
    }

    var messageId = allMessageIds.length === 1 ? allMessageIds[0] : allMessageIds;

    // Save to sheet
    try {
      saveTaskToSheet(requestData, messageId);
    } catch (sheetErr) {
      Logger.log("[doPost] Sheet save failed: " + sheetErr.toString());
    }

    return createSuccessResponse(messageId);

  } catch (error) {
    Logger.log("[doPost] Unhandled error: " + error.toString());
    return createErrorResponse("Server error", error.message);
  }
}

// ─── Complete task ────────────────────────────────────────────────────────────

function handleCompleteTask(requestData) {
  try {
    Logger.log("[handleCompleteTask] Task: " + requestData.taskName);

    // Update sheet status
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet && spreadsheet.getSheetByName("Dashboard");
    if (sheet) {
      var values = sheet.getDataRange().getValues();
      var searchId = Array.isArray(requestData.messageId) ? requestData.messageId[0] : requestData.messageId;
      searchId = String(searchId || '').replace(/^'/, '').trim();

      var rowFound = -1;
      var nameMatch = -1;

      for (var i = 1; i < values.length; i++) {
        var rowMsgId = String(values[i][7] || '').replace(/^'/, '').trim();
        var rowName  = String(values[i][1] || '').trim();

        if (searchId && rowMsgId === searchId) {
          rowFound = i + 1;
          break;
        }
        if (requestData.taskName && rowName === requestData.taskName.trim()) {
          nameMatch = i + 1;
        }
      }

      if (rowFound === -1) rowFound = nameMatch;

      if (rowFound > 0) {
        sheet.getRange(rowFound, 7).setValue("Completed");
        Logger.log("[handleCompleteTask] Updated row " + rowFound + " to Completed");
      } else {
        Logger.log("[handleCompleteTask] Row not found for messageId=" + searchId);
      }
    }

    // Build completion message
    var note = requestData.completionMessage ? "\n\n💬 **Message:** " + requestData.completionMessage : "";
    var body = [
      "✅ **Task Completed!**", "",
      "📝 **Task:** " + requestData.taskName,
      "📄 **Description:** " + (requestData.description || ""),  "",
      "👤 **Requested By:** " + requestData.user,
      "👥 **Assigned To:** " + requestData.assignedTo,
      "📊 **Status:** Completed" + note
    ].join("\n");

    var embed = { username: "Task Bot", content: body };

    // Send to webhooks
    var entries = requestData.webhookUrls || [];
    if (!entries.length && requestData.webhookUrl) {
      entries = [{ name: requestData.assignedTo, url: requestData.webhookUrl }];
    }
    entries.filter(function(e) { return e && e.url; }).forEach(function(entry) {
      try { sendToDiscord(entry.url, embed); } catch(e) {
        Logger.log("[handleCompleteTask] Failed: " + e.toString());
      }
    });

    return createSuccessResponse(requestData.messageId);
  } catch (error) {
    Logger.log("[handleCompleteTask] Error: " + error.toString());
    return createErrorResponse("Server error", error.message);
  }
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────

function saveTaskToSheet(taskData, messageId) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) return false;

  var sheet = spreadsheet.getSheetByName("Dashboard");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("Dashboard");
    var headers = ["Timestamp","Task Name","Description","Priority","Requester","Assigned To","Status","messageId"];
    var hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setValues([headers]);
    hRange.setFontWeight("bold").setBackground("#6a0dad").setFontColor("#ffffff");
  }

  var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM dd, yyyy 'at' hh:mm a");
  var msgIdStr = "'" + (Array.isArray(messageId) ? messageId.join(",") : messageId);

  // Try to find existing row by messageId
  if (taskData.messageId) {
    var values = sheet.getDataRange().getValues();
    var searchId = Array.isArray(taskData.messageId) ? taskData.messageId[0] : taskData.messageId;
    searchId = String(searchId).replace(/^'/, '').trim();

    for (var i = 1; i < values.length; i++) {
      var rowId = String(values[i][7] || '').replace(/^'/, '').trim();
      if (rowId === searchId) {
        sheet.getRange(i + 1, 1, 1, 8).setValues([[
          ts, taskData.taskName, taskData.description || "", taskData.priority,
          taskData.user, taskData.assignedTo, "In Progress", msgIdStr
        ]]);
        Logger.log("[saveTaskToSheet] Updated row " + (i + 1));
        return true;
      }
    }
  }

  // Append new row
  sheet.appendRow([ts, taskData.taskName, taskData.description || "", taskData.priority,
    taskData.user, taskData.assignedTo, "In Progress", msgIdStr]);
  Logger.log("[saveTaskToSheet] Appended new row");
  return true;
}

// ─── Discord helpers ──────────────────────────────────────────────────────────

function buildDiscordMessage(taskData) {
  var isUpdate = !!taskData.messageId;
  var header = isUpdate ? "📝 **Task Updated**" : "📌 **New Task Created**";
  var pri = taskData.priority === "High" ? "🔴" : taskData.priority === "Medium" ? "⚡" : "🟢";

  var body = [
    header, "",
    "📝 **Task:** " + taskData.taskName,
    "📄 **Description:** " + (taskData.description || "No description provided"), "",
    pri + " **Priority:** " + taskData.priority,
    "👤 **Requested By:** " + taskData.user,
    "👥 **Assigned To:** " + taskData.assignedTo,
    "📊 **Status:** In Progress"
  ].join("\n");

  return { username: "Task Bot", content: body };
}

function sendToDiscord(webhookUrl, embed) {
  var url = webhookUrl + "?wait=true";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(embed),
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code !== 200) {
    throw new Error("Discord returned " + code + ": " + text.substring(0, 200));
  }

  var data = JSON.parse(text);
  if (!data.id) throw new Error("Discord response missing message ID");
  return { messageId: data.id };
}

function updateDiscordMessage(webhookUrl, messageId, embed) {
  var parts = webhookUrl.match(/webhooks\/(\d+)\/([^\/\?]+)/);
  if (!parts) throw new Error("Invalid webhook URL format");

  var patchUrl = "https://discord.com/api/webhooks/" + parts[1] + "/" + parts[2] + "/messages/" + messageId;
  var options = {
    method: "patch",
    contentType: "application/json",
    payload: JSON.stringify(embed),
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(patchUrl, options);
  var code = response.getResponseCode();

  if (code === 404) throw new Error("Message not found");
  if (code !== 200) throw new Error("Discord PATCH returned " + code);
  return { messageId: messageId };
}

// ─── Response helpers ─────────────────────────────────────────────────────────

function createSuccessResponse(messageId) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true, messageId: messageId, timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function createSuccessResponseWithData(data) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true, data: data, timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(error, details) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false, error: error, details: details
  })).setMimeType(ContentService.MimeType.JSON);
}

// ─── Debug helper ─────────────────────────────────────────────────────────────

function debugSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dashboard");
  if (!sheet) { Logger.log("No Dashboard sheet"); return; }
  var values = sheet.getDataRange().getValues();
  values.forEach(function(row, i) {
    Logger.log("Row " + (i+1) + ": " + row.join(" | "));
  });
}
