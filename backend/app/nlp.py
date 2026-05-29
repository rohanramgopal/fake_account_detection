import re

# High-risk spam keywords commonly associated with bots, spammers, and fake accounts
SPAM_KEYWORDS = {
    'giveaway', 'crypto', 'win', 'cash', 'money', 'free', 'gift', 'card', 'onlyfans', 
    'whatsapp', 'telegram', 'follow', 'followback', 'f4f', 'dm', 'promo', 'promote', 
    'deal', 'discount', 'earn', 'investment', 'rich', 'wealth', 'hack', 'click', 'link', 
    'buy', 'sell', 'cheap', 'subscriber', 'followers', 'cashback', 'bonus', 'bitcoin',
    'ethereum', 'trading', 'signals', 'verified', 'guaranteed', 'limited', 'offer'
}

# Positive and negative word lists for sentiment analysis
POSITIVE_WORDS = {
    'love', 'great', 'best', 'amazing', 'beautiful', 'happy', 'proud', 'official', 
    'developer', 'creator', 'founder', 'designing', 'building', 'excited', 'passionate', 
    'peace', 'learning', 'sharing', 'helping', 'artist', 'musician', 'writer', 'family',
    'friend', 'enthusiast', 'life', 'good', 'joy', 'wonderful', 'fun', 'nature', 'work'
}

NEGATIVE_WORDS = {
    'scam', 'fake', 'hate', 'bad', 'worst', 'cheat', 'clickbait', 'spam', 'hack', 
    'broken', 'waste', 'liar', 'stole', 'stolen', 'ruin', 'terrible', 'annoying',
    'block', 'banned', 'suspended', 'scammed', 'danger', 'alert', 'warning', 'loser'
}

def clean_text(text: str) -> str:
    """Cleans text by converting to lowercase and removing punctuation."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return text

def calculate_spam_ratio(text: str) -> float:
    """Calculates the ratio of spam keywords to total words in the text."""
    cleaned = clean_text(text)
    words = cleaned.split()
    if not words:
        return 0.0
    
    spam_count = sum(1 for word in words if word in SPAM_KEYWORDS)
    return float(spam_count) / len(words)

def calculate_caps_ratio(text: str) -> float:
    """Calculates the ratio of uppercase characters to total alphabetical characters."""
    if not text:
        return 0.0
    alpha_chars = [c for c in text if c.isalpha()]
    if not alpha_chars:
        return 0.0
    caps_count = sum(1 for c in alpha_chars if c.isupper())
    return float(caps_count) / len(alpha_chars)

def calculate_sentiment(text: str) -> float:
    """
    Performs simple lexicon-based sentiment analysis.
    Returns a score between -1.0 (very negative) and 1.0 (very positive).
    """
    cleaned = clean_text(text)
    words = cleaned.split()
    if not words:
        return 0.0
    
    pos_count = sum(1 for word in words if word in POSITIVE_WORDS)
    neg_count = sum(1 for word in words if word in NEGATIVE_WORDS)
    
    diff = pos_count - neg_count
    total = pos_count + neg_count
    
    if total == 0:
        return 0.0
    return float(diff) / total

def calculate_lexical_diversity(text: str) -> float:
    """
    Calculates lexical diversity (Type-Token Ratio).
    A lower score means repetitive vocabulary, typical of automated template posts.
    """
    cleaned = clean_text(text)
    words = cleaned.split()
    if not words:
        return 0.0
    
    unique_words = set(words)
    return float(len(unique_words)) / len(words)

def analyze_text(text: str) -> dict:
    """Aggregates all text features into a single dictionary."""
    if not text:
        return {
            "spam_ratio": 0.0,
            "caps_ratio": 0.0,
            "sentiment": 0.0,
            "lexical_diversity": 0.0
        }
    return {
        "spam_ratio": calculate_spam_ratio(text),
        "caps_ratio": calculate_caps_ratio(text),
        "sentiment": calculate_sentiment(text),
        "lexical_diversity": calculate_lexical_diversity(text)
    }
