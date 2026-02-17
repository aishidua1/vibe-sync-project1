# Vibe-Sync Desk Companion - Pseudocode Implementation

This document contains the pseudocode for all major components of the Vibe-Sync system, describing the setup and core logic for each module.

**this pseudocode was mostly written by claude

## 1. Main Orchestration Loop

The main loop continuously monitors Spotify and Google Calendar, analyzes compatibility, and triggers alerts when mismatches are detected.

```
FUNCTION vibeSyncMainLoop():
    
    // Initialize API clients and settings
    INITIALIZE spotifyClient with OAuth credentials
    INITIALIZE calendarClient with OAuth credentials
    INITIALIZE aiGateway with Duke API key
    
    SET pollingInterval = 30 seconds
    SET lastAlertState = NULL
    
    // Main continuous monitoring loop
    WHILE system is running:
        
        // Step 1: Fetch current data from APIs
        currentTrack = fetchSpotifyNowPlaying(spotifyClient)
        upcomingEvents = fetchCalendarEvents(calendarClient, nextHours=2)
        
        // Step 2: Check if music is playing
        IF currentTrack is NULL:
            displayIdleState()
            WAIT pollingInterval
            CONTINUE to next iteration
        
        // Step 3: Extract and structure music metadata
        musicContext = {
            "track_name": currentTrack.name,
            "artist": currentTrack.artist,
            "valence": currentTrack.audio_features.valence,    // 0-1 (sad to happy)
            "energy": currentTrack.audio_features.energy,      // 0-1 (calm to intense)
            "tempo": currentTrack.audio_features.tempo         // BPM
        }
        
        // Step 4: Build calendar context array
        calendarContext = []
        FOR EACH event IN upcomingEvents:
            APPEND {
                "title": event.summary,
                "description": event.description,
                "start_time": event.start,
                "minutes_until": calculateTimeDelta(event.start)
            } TO calendarContext
        
        // Step 5: Send to AI Gateway for analysis
        aiResponse = analyzeVibeCompatibility(aiGateway, musicContext, calendarContext)
        
        // Step 6: Evaluate compatibility and determine if alert needed
        IF aiResponse.compatibility_score < 60:
            alert = {
                "type": "VIBE_MISMATCH",
                "severity": calculateSeverity(aiResponse.compatibility_score),
                "message": aiResponse.transition_suggestion,
                "score": aiResponse.compatibility_score,
                "next_event": calendarContext[0]
            }
            
            // Prevent duplicate alerts for same mismatch
            IF alert != lastAlertState:
                sendToDashboard(alert)
                lastAlertState = alert
        ELSE:
            // Vibes are synced
            sendToDashboard({"type": "SYNCED", "score": aiResponse.compatibility_score})
            lastAlertState = NULL
        
        // Step 7: Wait before next poll
        WAIT pollingInterval
    
END FUNCTION
```

---

## 2. Spotify Data Fetching

Fetches currently playing track and its audio features from Spotify Web API.

```
FUNCTION fetchSpotifyNowPlaying(client):
    
    TRY:
        // Get current playback state
        response = client.getCurrentPlayback()
        
        // Check if music is actually playing
        IF response is NULL OR response.is_playing == FALSE:
            RETURN NULL
        
        // Extract basic track info
        trackInfo = {
            "id": response.item.id,
            "name": response.item.name,
            "artist": response.item.artists[0].name,
            "album": response.item.album.name
        }
        
        // Fetch audio features for analysis
        audioFeatures = client.getAudioFeatures(trackInfo.id)
        
        // Combine and return
        RETURN {
            "name": trackInfo.name,
            "artist": trackInfo.artist,
            "audio_features": {
                "valence": audioFeatures.valence,
                "energy": audioFeatures.energy,
                "tempo": audioFeatures.tempo,
                "danceability": audioFeatures.danceability
            }
        }
        
    CATCH APIError as error:
        logError("Spotify API error", error)
        RETURN NULL
        
    CATCH AuthenticationError as error:
        logError("Spotify authentication failed - token may be expired", error)
        refreshSpotifyToken()
        RETURN NULL

END FUNCTION
```

---

## 3. Calendar Data Fetching

Retrieves upcoming events from Google Calendar within a specified time window.

```
FUNCTION fetchCalendarEvents(client, nextHours):
    
    // Define time window
    SET timeMin = getCurrentTimestamp()
    SET timeMax = timeMin + (nextHours * 60 * 60)  // Convert hours to seconds
    
    TRY:
        // Query Google Calendar API
        response = client.events().list(
            calendarId = "primary",
            timeMin = formatISO8601(timeMin),
            timeMax = formatISO8601(timeMax),
            singleEvents = TRUE,
            orderBy = "startTime"
        ).execute()
        
        events = response.get("items", [])
        
        // Filter out cancelled events
        validEvents = []
        FOR EACH event IN events:
            IF event.status != "cancelled":
                APPEND {
                    "summary": event.summary,
                    "description": event.get("description", ""),
                    "start": event.start.dateTime,
                    "end": event.end.dateTime,
                    "location": event.get("location", "")
                } TO validEvents
        
        RETURN validEvents
        
    CATCH APIError as error:
        logError("Calendar API error", error)
        RETURN []
        
    CATCH AuthenticationError as error:
        logError("Calendar authentication failed", error)
        refreshCalendarToken()
        RETURN []

END FUNCTION
```

---

## 4. AI Gateway Analysis

Sends music and calendar context to Duke AI Gateway for LLM-powered compatibility analysis.

```
FUNCTION analyzeVibeCompatibility(aiGateway, musicContext, calendarContext):
    
    // Build structured prompt for LLM
    prompt = """
    ROLE: You are a context-switching assistant analyzing vibe compatibility.
    
    CURRENT MUSIC:
    - Track: {musicContext.track_name} by {musicContext.artist}
    - Valence (positivity): {musicContext.valence} (0=sad, 1=happy)
    - Energy (intensity): {musicContext.energy} (0=calm, 1=intense)
    - Tempo: {musicContext.tempo} BPM
    
    UPCOMING SCHEDULE:
    """ + formatCalendarForPrompt(calendarContext) + """
    
    TASK:
    1. Assess the MOOD of the music (energizing/calming/neutral/focus-inducing)
    2. Assess the INTENT of the next calendar event (deep-focus/collaborative/creative/administrative)
    3. Rate compatibility on a scale of 0-100 (100 = perfect match)
    4. If score < 60, suggest a specific transition action
    
    RESPOND IN JSON FORMAT ONLY:
    {
        "music_mood": "string description",
        "task_intent": "string description",
        "compatibility_score": number (0-100),
        "transition_suggestion": "string or null"
    }
    """
    
    TRY:
        // Send request to Duke AI Gateway
        response = POST(aiGateway.endpoint, {
            "model": "gpt-4",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a context-switching assistant. Respond only in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7
        })
        
        // Parse JSON response
        result = parseJSON(response.content)
        
        // Validate response structure
        IF NOT hasRequiredFields(result, ["music_mood", "task_intent", "compatibility_score"]):
            THROW ValidationError("Invalid response format")
        
        RETURN result
        
    CATCH APIError as error:
        logError("AI Gateway API error", error)
        // Fail-safe: assume synced to avoid false alarms
        RETURN {
            "music_mood": "unknown",
            "task_intent": "unknown",
            "compatibility_score": 100,
            "transition_suggestion": NULL
        }
        
    CATCH JSONParseError as error:
        logError("Failed to parse AI response", error)
        RETURN {
            "compatibility_score": 100,
            "transition_suggestion": NULL
        }

END FUNCTION


// Helper function to format calendar for LLM prompt
FUNCTION formatCalendarForPrompt(calendarContext):
    
    IF calendarContext is empty:
        RETURN "No upcoming events in the next 2 hours."
    
    formattedText = ""
    FOR EACH event IN calendarContext:
        formattedText += "- " + event.title
        formattedText += " (in " + event.minutes_until + " minutes)"
        
        IF event.description is not empty:
            formattedText += ": " + event.description
        
        formattedText += "\n"
    
    RETURN formattedText

END FUNCTION
```

---

## 5. Mismatch Detection & Alert Generation

Evaluates the compatibility score and generates appropriate alerts with severity levels.

```
FUNCTION calculateSeverity(compatibilityScore):
    
    // Determine severity based on how mismatched the vibe is
    IF compatibilityScore < 30:
        RETURN "HIGH"        // Major mismatch - urgent attention needed
    ELSE IF compatibilityScore < 50:
        RETURN "MEDIUM"      // Noticeable mismatch - suggestion helpful
    ELSE IF compatibilityScore < 60:
        RETURN "LOW"         // Minor mismatch - gentle nudge
    ELSE:
        RETURN "NONE"        // No mismatch

END FUNCTION


FUNCTION createAlert(aiResponse, nextEvent):
    
    severity = calculateSeverity(aiResponse.compatibility_score)
    
    // Build alert object
    alert = {
        "type": "VIBE_MISMATCH",
        "severity": severity,
        "compatibility_score": aiResponse.compatibility_score,
        "music_mood": aiResponse.music_mood,
        "task_intent": aiResponse.task_intent,
        "transition_suggestion": aiResponse.transition_suggestion,
        "next_event": {
            "title": nextEvent.title,
            "start_time": nextEvent.start_time,
            "minutes_until": nextEvent.minutes_until
        },
        "timestamp": getCurrentTimestamp()
    }
    
    RETURN alert

END FUNCTION
```

---

## 6. Dashboard Communication

Sends state updates and alerts to the frontend dashboard for user display.

```
FUNCTION sendToDashboard(data):
    
    // Add metadata
    data.timestamp = getCurrentTimestamp()
    data.version = "1.0"
    
    TRY:
        // Attempt WebSocket push (real-time)
        IF websocketConnected:
            websocket.send(JSON.stringify(data))
            logInfo("Dashboard updated via WebSocket")
        
        ELSE:
            // Fallback: Store for HTTP polling
            dashboardState.updateCurrentState(data)
            logInfo("Dashboard state updated for polling")
        
        RETURN SUCCESS
        
    CATCH ConnectionError as error:
        logError("Failed to send to dashboard", error)
        
        // Store locally to ensure no data loss
        cacheManager.store("pending_dashboard_update", data)
        RETURN FAILURE

END FUNCTION


FUNCTION displayIdleState():
    
    idleData = {
        "type": "IDLE",
        "message": "No music currently playing",
        "timestamp": getCurrentTimestamp()
    }
    
    sendToDashboard(idleData)

END FUNCTION
```

---

## Helper Functions

```
FUNCTION calculateTimeDelta(futureTime):
    
    currentTime = getCurrentTimestamp()
    difference = futureTime - currentTime
    minutesUntil = difference / 60
    
    RETURN ROUND(minutesUntil)

END FUNCTION


FUNCTION getCurrentTimestamp():
    
    RETURN current Unix timestamp in seconds

END FUNCTION


FUNCTION formatISO8601(timestamp):
    
    RETURN timestamp formatted as ISO 8601 string
    // Example: "2024-02-15T17:30:00Z"

END FUNCTION


FUNCTION logError(message, error):
    
    WRITE TO error_log:
        "[ERROR] " + getCurrentTimestamp() + " - " + message + ": " + error.toString()

END FUNCTION


FUNCTION logInfo(message):
    
    WRITE TO info_log:
        "[INFO] " + getCurrentTimestamp() + " - " + message

END FUNCTION
```

---

## Error Handling Strategy

Throughout the system, we implement a fail-safe approach:

1. **API Failures**: Return NULL or empty arrays, allowing system to continue
2. **Authentication Errors**: Log error, attempt token refresh, continue operation
3. **LLM Analysis Failure**: Default to "synced" state (score = 100) to avoid false alarms
4. **Dashboard Connection Issues**: Cache updates locally for later delivery

This ensures the system remains resilient and doesn't crash on transient failures.

---
