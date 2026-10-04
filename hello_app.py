import argparse
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description="A tiny greeting app.")
    parser.add_argument("--name", default="friend", help="Your name")
    parser.add_argument("--language", default="Python", help="Your favorite programming language")
    args = parser.parse_args()

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"Hello, {args.name}! Nice to meet you.")
    print(f"Your favorite language is {args.language}.")
    print(f"The current time is {now}.")


if __name__ == "__main__":
    main()
