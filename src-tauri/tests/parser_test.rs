use grok_desktop_lib::runs::event::GrokEvent;
use grok_desktop_lib::runs::parser::parse_line;

#[test]
fn parses_thought_event() {
    let line = r#"{"type":"thought","data":"hi"}"#;
    let event = parse_line(line).expect("should parse");
    matches!(event, GrokEvent::Thought { data } if data == "hi");
}

#[test]
fn parses_text_event() {
    let line = r#"{"type":"text","data":"hello"}"#;
    let event = parse_line(line).expect("should parse");
    matches!(event, GrokEvent::Text { data } if data == "hello");
}

#[test]
fn parses_end_event() {
    let line = r#"{"type":"end","stopReason":"EndTurn","sessionId":"abc","requestId":"xyz"}"#;
    let event = parse_line(line).expect("should parse");
    if let GrokEvent::End {
        stop_reason,
        session_id,
        request_id,
    } = event
    {
        assert_eq!(stop_reason, "EndTurn");
        assert_eq!(session_id, "abc");
        assert_eq!(request_id, "xyz");
    } else {
        panic!("expected End variant");
    }
}

#[test]
fn parses_error_event() {
    let line = r#"{"type":"error","message":"subscription required"}"#;
    let event = parse_line(line).expect("should parse");
    if let GrokEvent::Error { message } = event {
        assert_eq!(message, "subscription required");
    } else {
        panic!("expected Error variant");
    }
}

#[test]
fn parses_openai_text_delta_event() {
    let line = r#"{"type":"response.output_text.delta","delta":"hel"}"#;
    let event = parse_line(line).expect("should parse");
    if let GrokEvent::Text { data } = event {
        assert_eq!(data, "hel");
    } else {
        panic!("expected Text variant");
    }
}

#[test]
fn parses_anthropic_content_block_delta_event() {
    let line = r#"{"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}"#;
    let event = parse_line(line).expect("should parse");
    if let GrokEvent::Text { data } = event {
        assert_eq!(data, "lo");
    } else {
        panic!("expected Text variant");
    }
}

#[test]
fn unknown_type_falls_back_to_unknown() {
    let line = r#"{"type":"tool_use","data":{"name":"bash"}}"#;
    let event = parse_line(line).expect("should parse as Unknown");
    matches!(event, GrokEvent::Unknown);
}

#[test]
fn invalid_json_returns_err() {
    let line = "{not json";
    assert!(parse_line(line).is_err());
}
