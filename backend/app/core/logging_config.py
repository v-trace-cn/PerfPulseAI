import logging
import os
from logging.handlers import TimedRotatingFileHandler
import sys

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'app.log')

# 彩色日志格式（仅控制台）
class ColorFormatter(logging.Formatter):
    COLORS = {
        'DEBUG': '\033[36m',    # 青色
        'INFO': '\033[32m',     # 绿色
        'WARNING': '\033[33m',  # 黄色
        'ERROR': '\033[31m',    # 红色
        'CRITICAL': '\033[41m', # 红底
    }
    RESET = '\033[0m'
    def format(self, record):
        color = self.COLORS.get(record.levelname, '')
        msg = super().format(record)
        return f"{color}{msg}{self.RESET}" if color and sys.stderr.isatty() else msg

# 日志格式
LOG_FORMAT = '[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# 文件日志 handler（按天分割，保留60天）
file_handler = TimedRotatingFileHandler(LOG_FILE, when='midnight', backupCount=60, encoding='utf-8')
file_handler.suffix = "%Y-%m-%d.log"
file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
file_handler.setLevel(logging.INFO)

# 控制台日志 handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(ColorFormatter(LOG_FORMAT, DATE_FORMAT))
console_handler.setLevel(logging.DEBUG)

# 根 logger 配置
logging.basicConfig(level=logging.DEBUG, handlers=[file_handler, console_handler])

# 过滤无效日志: 忽略 watchfiles 、aiosqlite 库的自动重载通知
logging.getLogger('watchfiles').setLevel(logging.WARNING)
logging.getLogger('watchfiles.main').setLevel(logging.WARNING)
logging.getLogger('aiosqlite').setLevel(logging.WARNING)

# 过滤无效日志: 忽略 httpcore 和 httpx 库的调试日志
logging.getLogger('httpcore').setLevel(logging.WARNING)
logging.getLogger('httpx').setLevel(logging.WARNING)

# 过滤无效日志: 忽略 asyncio 库的调试日志
logging.getLogger('asyncio').setLevel(logging.WARNING)
# 彻底禁用 watchfiles 日志输出
watch_logger = logging.getLogger('watchfiles')
watch_logger.setLevel(logging.CRITICAL)
watch_logger.propagate = False

# 过滤无效日志: 忽略 OpenAI 相关的调试日志
logging.getLogger('openai').setLevel(logging.WARNING)
logging.getLogger('openai._base_client').setLevel(logging.WARNING)
logging.getLogger('openai.resources').setLevel(logging.WARNING)
logging.getLogger('openai.resources.chat').setLevel(logging.WARNING)
logging.getLogger('openai.resources.chat.completions').setLevel(logging.WARNING)

# 彻底禁用 OpenAI 调试日志输出
openai_logger = logging.getLogger('openai._base_client')
openai_logger.setLevel(logging.CRITICAL)
openai_logger.propagate = False

# 工具函数，便于各模块获取 logger
def get_logger(name=None):
    return logging.getLogger(name)

# 推荐用法：from app.core.logging_config import logger
logger = get_logger('PerfPulseAI') 