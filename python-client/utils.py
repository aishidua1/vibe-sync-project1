import logging
import sys

#configures logging for python client
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="[%(levelname)s] %(asctime)s - %(name)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("vibe_sync.log"),
        ],
    )
