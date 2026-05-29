import random
import pandas as pd
from app.nlp import analyze_text

# Lists for generating names and content
FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Jamie", "Casey", "Robin", "Pat", "David", "Sarah", "Emily", "Michael", "Jessica", "James", "Elena", "Daniel", "Sofia", "Ryan", "Emma", "John", "Liam", "Olivia", "Noah", "Ava", "Lucas", "Mia"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"]

GENUINE_BIOS = [
    "Software engineer loving open source and coffee. Views my own. ☕",
    "Digital creator, photographer, and traveler. Sharing my perspective on the world. 📸✈️",
    "Fitness coach | Helping you reach your goals | Runner 🏃‍♂️",
    "Guitarist & music producer. Check out my latest tracks in the link! 🎵",
    "Food blogger and amateur chef. Cooking up a storm every day. 🍳",
    "Just a human exploring the universe. Biology student at State College.",
    "Dad, husband, and passionate gardener. Living life one day at a time.",
    "UI/UX designer. Making the web beautiful and accessible.",
    "Bookworm 📚. Writer of fantasy novels. Cat mom.",
    "Full time gamer, part time dreamer. Streaming every Tuesday!"
]

SPAM_BIOS = [
    "⚡ WIN A FREE IPHONE 15 NOW! ⚡ CLICK THE LINK BELOW TO CLAIM YOUR PRIZE! 👇👇",
    "Get rich quick! Trade bitcoin with my automated bot. 100% guaranteed returns. DM for info!",
    "EXCLUSIVE DISCOUNTS! Up to 80% off on designer bags. Shop now before stock runs out!",
    "Increase your followers fast! Cheap and active followers. Visit our website now!",
    "Looking for fun? Add me on Snapchat / WhatsApp for exclusive content! Links inside! 💋",
    "Join my Telegram channel for daily free signals and cryptocurrency updates! 📈",
    "Earn $500/day working from home. No experience needed. Start now by clicking my link!",
    "Cheap game codes, keys, and gift cards. Cheapest on the net! 🎮🔥",
    "Check out my page for verified methods to make money online easily!",
    "🔞 ONLYFANS DISCOUNT 50% OFF FOR THE NEXT 24 HOURS! DON'T MISS OUT! 🔞"
]

IMPERSONATOR_BIOS = [
    "Official fan page for tech & science updates. Not affiliated with any celebrity. Updates daily.",
    "Backup account for customer support. Send a direct message to resolve your account issues.",
    "Crypto support representative. Having issues with your wallet? DM me for instant assistance.",
    "Community manager. Providing official announcements and giveaway updates.",
    "Verified support desk. Contact us immediately for security verification."
]

HARVESTER_BIOS = [
    "Automated data collection agent. Archiving public social media metrics for academic research.",
    "Scraping public profiles. Database node #283. Running Python Scrapy scripts. Objective log.",
    "System log for public records. Archiving global API endpoints and sentiment trends index.",
    "Data bot monitoring trending tags. Open source metadata crawler.",
    "Platform statistics index. Running automatic index routines every hour."
]

ASTROTURFER_BIOS = [
    "PROUD PATRIOT. Standing for the TRUTH. Down with the corrupt media! 🇺🇸",
    "Voice of the people. Exposing the lies and scandals of the campaign. Awake, not woke!",
    "Freedom Fighter. Campaign tracker. Sharing the real truth about global elites. 📢",
    "Truth seeker. Anti-propaganda activist. Exposing government conspiracies and hoaxes.",
    "True conservative. Defending liberties, opposing the corrupt establishment. Follow for alerts."
]

# Posts per archetype
GENUINE_POSTS = [
    "Just finished a great run! The weather is perfect today. 🌞",
    "Working on a new React dashboard. CSS styling is coming along nicely!",
    "Had the best pasta of my life at that new Italian place downtown.",
    "Highly recommend reading 'Atomic Habits'. Really changes how you look at routines.",
    "Beautiful sunset today. Nature never fails to amaze. 🌅",
    "Can't believe it's already Friday. Hope everyone has a relaxing weekend!",
    "Learning Python has been such a fun journey. Excited to build more ML models.",
    "Here is a photo of my dog sleeping on my keyboard. Very helpful assistant. 🐶",
    "Had a great brainstorming session with the design team today.",
    "Struggling with a bug for three hours, and it turned out to be a typo. Classic coding."
]

SPAM_POSTS = [
    "👉 CLICK HERE TO WIN $10,000 CASH PRIZE! NO SCAM! 100% REAL! 💵💵",
    "Bitcoin is going to the moon! 🚀 Invest now and double your money in 24 hours. DM for details!",
    "Do you want 10k followers? We offer cheap, active followers with fast delivery! Link in bio!",
    "Join our VIP Telegram group for free trading signals! 85% accuracy guaranteed!",
    "Add me on WhatsApp +1-893-274-1234 for secret chat and fun! 😉",
    "Get your cheap Amazon gift cards here! Only a few left in stock!",
    "Earn passive income from home easily. I made $2000 this week. Link below! 👇",
    "MASSIVE DISCOUNTS on hoodies and t-shirts! Use code SPAM20 at checkout!",
    "Follow me and I will follow back instantly! F4F followback guaranteed! 💯",
    "Exclusive leaks and videos on my profile link. Check it out now before it gets taken down!"
]

HARVESTER_POSTS = [
    "Data checkpoint: ID 827439. Average word length: 4.82. Common tag: #tech.",
    "Sentiment analysis results: Positive 42.1%, Neutral 38.2%, Negative 19.7%.",
    "Index table updated successfully. Total records recorded: 5,429,812 rows.",
    "Crawling tag directories. Network status: online. Database connectivity latency: 12ms.",
    "Periodic statistics backup completed. Storage usage: 48.2% of total allocated quota."
]

ASTROTURFER_POSTS = [
    "THE CORRUPT MEDIA IS LYING! This whole campaign is a rigged hoax to deceive you!",
    "We must stand up and VOTE out the corrupt politicians! Spread the truth now! 📢🇺🇸",
    "Another massive SCANDAL exposed today. When will the corrupt government be held accountable?",
    "Fake news is spreading everywhere. Stop listening to their propaganda and wake up!",
    "This is an absolute disgrace! Our liberties are under attack by the woke elite!"
]

def generate_profile(is_fake=None) -> dict:
    """
    Generates a single synthetic profile with pre-computed NLP and metadata features,
    belonging to one of 7 distinct categories (1 genuine, 6 malicious subtypes).
    """
    if is_fake is None:
        is_fake = random.choice([0, 1])
        
    if is_fake == 0:
        profile_type = "genuine"
    else:
        profile_type = random.choice(["spambot", "inactive", "impersonator", "harvester", "astroturfer", "hijacked"])
    
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    
    # 1. Metadata defaults
    has_profile_pic = 1
    has_link_in_bio = 0
    display_name = ""
    username = ""
    bio = ""
    followers = 150
    following = 120
    posts_count = 50
    posts_frequency = 1.0
    posts = []
    
    if profile_type == "genuine":
        display_name = f"{first} {last}"
        username = f"{first.lower()}_{last.lower()}"
        if random.random() < 0.2:
            username += str(random.randint(1, 99))
        
        has_profile_pic = 1 if random.random() < 0.96 else 0
        bio = random.choice(GENUINE_BIOS)
        has_link_in_bio = 1 if random.random() < 0.3 else 0
        
        followers = random.randint(100, 25000)
        following = random.randint(80, 2000)
        posts_count = random.randint(20, 1200)
        posts_frequency = round(random.uniform(0.1, 4.0), 2)
        
        posts = random.sample(GENUINE_POSTS, min(4, len(GENUINE_POSTS)))
        
    elif profile_type == "spambot":
        display_name = random.choice([f"⚡ {first} Crypto ⚡", f"FREE GIVEAWAYS", f"{first} Earn Cash", f"VIP Signals {last}"])
        username = f"{first.lower()}{last.lower()}{random.randint(100000, 999999)}"
        has_profile_pic = 1 if random.random() < 0.5 else 0
        bio = random.choice(SPAM_BIOS)
        has_link_in_bio = 1
        
        followers = random.randint(5, 450)
        following = random.randint(800, 4800)
        posts_count = random.randint(150, 4000)
        posts_frequency = round(random.uniform(15.0, 95.0), 2)
        
        posts = random.sample(SPAM_POSTS, min(4, len(SPAM_POSTS)))
        
    elif profile_type == "inactive":
        display_name = "" if random.random() < 0.5 else f"{first} {last}"
        chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        username = ''.join(random.choice(chars) for _ in range(random.randint(8, 15)))
        has_profile_pic = 1 if random.random() < 0.15 else 0
        bio = "" if random.random() < 0.7 else random.choice(["hello", "hey there", "social account"])
        has_link_in_bio = 0
        
        followers = random.randint(0, 5)
        following = random.randint(100, 1200)
        posts_count = random.randint(0, 2)
        posts_frequency = 0.0
        
        posts = ["Just joined!"] if posts_count > 0 else []
        
    elif profile_type == "impersonator":
        display_name = f"{first} {last} (Official Support)"
        username = f"{first.lower()}_{last.lower()}_support" if random.random() < 0.5 else f"real_{first.lower()}{last.lower()}"
        has_profile_pic = 1
        bio = random.choice(IMPERSONATOR_BIOS)
        has_link_in_bio = 1 if random.random() < 0.8 else 0
        
        followers = random.randint(20, 1500)
        following = random.randint(800, 3200)
        posts_count = random.randint(5, 120)
        posts_frequency = round(random.uniform(0.5, 6.0), 2)
        
        posts = random.sample(GENUINE_POSTS, 2) + random.sample(SPAM_POSTS, 2)
        
    elif profile_type == "harvester":
        display_name = f"Data Bot {random.randint(10,99)}"
        username = f"harvester_node_{random.randint(100,999)}"
        has_profile_pic = 1 if random.random() < 0.7 else 0
        bio = random.choice(HARVESTER_BIOS)
        has_link_in_bio = 0
        
        followers = random.randint(2, 80)
        following = random.randint(1500, 8000) # Follows lots of profiles to scrape
        posts_count = random.randint(500, 25000)
        posts_frequency = round(random.uniform(20.0, 75.0), 2) # Constant data dumping
        
        posts = random.sample(HARVESTER_POSTS, min(4, len(HARVESTER_POSTS)))
        
    elif profile_type == "astroturfer":
        display_name = f"Patriot {first}"
        username = f"truth_warrior_{random.randint(1000,9999)}"
        has_profile_pic = 1 if random.random() < 0.8 else 0
        bio = random.choice(ASTROTURFER_BIOS)
        has_link_in_bio = 1 if random.random() < 0.4 else 0
        
        followers = random.randint(50, 2800)
        following = random.randint(500, 4000)
        posts_count = random.randint(400, 15000)
        posts_frequency = round(random.uniform(5.0, 45.0), 2)
        
        posts = random.sample(ASTROTURFER_POSTS, min(4, len(ASTROTURFER_POSTS)))
        
    elif profile_type == "hijacked":
        # Was organic, so profile is realistic but content is spammy
        display_name = f"{first} {last}"
        username = f"{first.lower()}_{last.lower()}"
        has_profile_pic = 1
        bio = f"Runner, coffee explorer. Views my own. ☕ Check out this link for cash: bit.ly/spam"
        has_link_in_bio = 1
        
        followers = random.randint(4500, 95000) # High original followers
        following = random.randint(150, 950) # Normal following
        posts_count = random.randint(500, 8500)
        posts_frequency = round(random.uniform(25.0, 90.0), 2) # Spike in posts
        
        # Mix of old genuine posts and new spam posts
        posts = [
            "CLAIM YOUR FREE $10,000 NOW! EXCLUSIVE OFFER! 👇",
            "Double your crypto coins in 2 hours! 100% legal!",
            "Had a great run this morning in the park. Perfect weather.",
            "Can't wait to visit New York next week!"
        ]
        
    # 2. Text features & NLP computation
    full_text = bio + " " + " ".join(posts)
    nlp_features = analyze_text(full_text)
    
    # Username digit ratio
    digits = sum(1 for c in username if c.isdigit())
    username_digit_ratio = float(digits) / len(username) if username else 0.0
    
    # Reputation score (followers / (followers + following))
    reputation_score = float(followers) / (followers + following) if (followers + following) > 0 else 0.0
    
    return {
        "metadata": {
            "username": username,
            "display_name": display_name,
            "bio": bio,
            "has_profile_pic": has_profile_pic,
            "has_link_in_bio": has_link_in_bio,
            "followers_count": followers,
            "following_count": following,
            "posts_count": posts_count,
            "posts_frequency": posts_frequency,
            "recent_posts": posts,
            "profile_type": profile_type
        },
        "features": {
            "username_length": len(username),
            "username_digit_ratio": username_digit_ratio,
            "has_profile_pic": has_profile_pic,
            "bio_length": len(bio),
            "has_link_in_bio": has_link_in_bio,
            "followers_count": followers,
            "following_count": following,
            "reputation_score": reputation_score,
            "posts_count": posts_count,
            "posts_frequency": posts_frequency,
            "spam_ratio": nlp_features["spam_ratio"],
            "caps_ratio": nlp_features["caps_ratio"],
            "sentiment": nlp_features["sentiment"],
            "lexical_diversity": nlp_features["lexical_diversity"]
        },
        "is_fake": is_fake
    }

def generate_dataset(size=5000) -> pd.DataFrame:
    """Generates a dataset of size `size` as a pandas DataFrame for ML training."""
    data = []
    for _ in range(size):
        profile = generate_profile()
        row = profile["features"].copy()
        row["is_fake"] = profile["is_fake"]
        data.append(row)
    return pd.DataFrame(data)
