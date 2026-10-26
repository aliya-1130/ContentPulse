import ctranslate2
import sentencepiece as spm

MODEL_PATH = r"C:\Users\galaxy computers\.cache\huggingface\hub\models--mijuanlo--nllb-200-distilled-600M-ct2-int8\snapshots\16bc5ff0482f9f1c0d35bdef950721ce58640789"

print("Loading tokenizer...")
sp = spm.SentencePieceProcessor()
sp.load(MODEL_PATH + r"\sentencepiece.bpe.model")

print("Loading NLLB INT8 model...")
translator = ctranslate2.Translator(
    MODEL_PATH,
    device="cpu",
    compute_type="int8",
)

source_text = "नमस्ते, मैं आज कॉलेज जा रही हूँ।"

source_tokens = [
    "hin_Deva"
] + sp.encode(
    source_text,
    out_type=str,
) + ["</s>"]

print("Translating...")

result = translator.translate_batch(
    [source_tokens],
    target_prefix=[["eng_Latn"]],
    beam_size=4,
)

output_tokens = result[0].hypotheses[0]

translation = sp.decode(output_tokens)

print("TRANSLATION:", translation)
print("TEST PASSED")