use super::event::GrokEvent;
use serde_json::Value;

pub fn parse_line(line: &str) -> Result<GrokEvent, serde_json::Error> {
    let raw = serde_json::from_str::<Value>(line)?;
    Ok(normalize_event(&raw))
}

fn normalize_event(raw: &Value) -> GrokEvent {
    let event_type = raw
        .get("type")
        .or_else(|| raw.get("event"))
        .or_else(|| raw.get("kind"))
        .and_then(Value::as_str)
        .unwrap_or_default();

    match event_type {
        "thought" => text_payload(raw)
            .map(|data| GrokEvent::Thought { data })
            .unwrap_or(GrokEvent::Unknown),
        "text" => text_payload(raw)
            .map(|data| GrokEvent::Text { data })
            .unwrap_or(GrokEvent::Unknown),
        "error" => GrokEvent::Error {
            message: error_payload(raw).unwrap_or_else(|| raw.to_string()),
        },
        "end" => GrokEvent::End {
            stop_reason: raw
                .get("stopReason")
                .or_else(|| raw.get("stop_reason"))
                .and_then(Value::as_str)
                .unwrap_or("EndTurn")
                .to_string(),
            session_id: raw
                .get("sessionId")
                .or_else(|| raw.get("session_id"))
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            request_id: raw
                .get("requestId")
                .or_else(|| raw.get("request_id"))
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
        },
        // Be tolerant of provider-style streaming events. Some CLIs forward
        // OpenAI/Anthropic chunks rather than normalizing to {type:"text"}.
        "response.output_text.delta" | "output_text_delta" | "text_delta" => text_payload(raw)
            .map(|data| GrokEvent::Text { data })
            .unwrap_or(GrokEvent::Unknown),
        "content_block_delta" | "message_delta" => nested_delta_text(raw)
            .map(|data| GrokEvent::Text { data })
            .unwrap_or(GrokEvent::Unknown),
        _ => GrokEvent::Unknown,
    }
}

fn text_payload(raw: &Value) -> Option<String> {
    for key in ["data", "text", "delta", "content"] {
        if let Some(value) = raw.get(key).and_then(Value::as_str) {
            return Some(value.to_string());
        }
    }
    raw.get("message")
        .and_then(|message| message.get("content"))
        .and_then(Value::as_str)
        .map(str::to_string)
}

fn nested_delta_text(raw: &Value) -> Option<String> {
    raw.get("delta")
        .and_then(|delta| {
            delta
                .get("text")
                .or_else(|| delta.get("content"))
                .or_else(|| delta.get("data"))
        })
        .and_then(Value::as_str)
        .map(str::to_string)
        .or_else(|| text_payload(raw))
}

fn error_payload(raw: &Value) -> Option<String> {
    for key in ["message", "error", "stderr"] {
        match raw.get(key) {
            Some(Value::String(value)) => return Some(value.clone()),
            Some(value) if value.is_object() => {
                if let Some(message) = value.get("message").and_then(Value::as_str) {
                    return Some(message.to_string());
                }
            }
            _ => {}
        }
    }
    None
}
