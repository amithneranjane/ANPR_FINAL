from anpr_ocr_engine import normalize_indian_plate_characters, clean_alphanumeric, is_valid_indian_format

def test_norm(text):
    clean = clean_alphanumeric(text)
    norm = normalize_indian_plate_characters(clean)
    print(f"Input: {text:15s} -> Clean: {clean:15s} -> Norm: {norm:15s} -> Valid: {is_valid_indian_format(norm)}")

# Test BRZBAE1922
test_norm("BRZBAE1922")
test_norm("BR2BAE1922")
test_norm("MHILGN9239")
test_norm("MH1LGN9239")
test_norm("TN63BY7954")
test_norm("FTN6JBY295C")
test_norm("TN45N3729")
