# ssdump.py
# Catalogues items in a SyncSketch.com account
# Requires ss_username and ss_api_key to be exported in env var
# Requires keywords from account-specific items in config.yaml
# pip3 install yaml confuse syncsketch

from syncsketch import SyncSketchAPI
import yaml 
import confuse
from os import environ
import sys
from ssdict import ssdict

def findObject(dict,keywd):
    for item in dict:
        if keywd in item['name']:
            theMedia = item
            break
        else: 
            theMedia = {}
    return theMedia

configuration = confuse.Configuration("sstest", __name__)
configuration.set_file('./config.yaml')
BASE_URL=configuration['base_url'].get()

if "ss_username" in environ:
    USERNAME = environ.get('ss_username')
else:
    print('\nPlease export your Syncsketch username as an environment variable called "ss_username"\n')
    sys.exit()

if "ss_api_key" in environ:
    API_KEY = environ.get('ss_api_key')
else:
    print('\nPlease export your Syncsketch API key as an environment variable called "ss_api_key"\n')
    sys.exit()

ss = SyncSketchAPI(USERNAME,API_KEY)
print('\nConnected to SyncSketch? ' + str(ss.is_connected()))

# Fetch Accounts
# gets first account
accounts = ss.get_accounts()
ACCOUNT_ID = accounts['objects'][0]
print('\nAccount ID: ' + str(ACCOUNT_ID['id']) + ': ' + ACCOUNT_ID['name'])

# Fetch Projects
projectsDict = ssdict(ss,ACCOUNT_ID,'projects')
print(projectsDict.getCatalogue())

# Choose a Project Under Test
itemkeyword = configuration['ProjectUnderTest'].get()
theProject = findObject(projectsDict.collection,itemkeyword)

# Fetch Reviews
reviewsDict = ssdict(ss,theProject['id'],'reviews')
print(reviewsDict.getCatalogue())

#Choose a Review Under Test
itemkeyword = configuration['ReviewUnderTest'].get()
theReview = findObject(reviewsDict.collection,itemkeyword)

# Fetch Items
itemsDict = ssdict(ss,theReview['id'],'items')
print(itemsDict.getCatalogue())

#Choose an Item Under Test
itemkeyword = configuration['ItemUnderTest'].get()
theItem = findObject(itemsDict.collection,itemkeyword)

# Fetch Comments
commentsDict = ssdict(ss,theItem['id'],'comments')
print(commentsDict.getCatalogue())
