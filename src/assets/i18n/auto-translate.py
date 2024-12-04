"""
 Author: Mike Dennis
 Date: 1/16/2024
 Desc:
    Translates json object values from one language to another
    using the Azure Translator API

"""
print("start")

#pip install azure-ai-translation-text azure-identity azure-keyvault-secrets
from azure.ai.translation.text import TextTranslationClient
from azure.ai.translation.text.models import InputTextItem
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential
import json

###############
# Config
###############
KV_NAME = 'mobins-t10us-cvx'
SECRET_NAME = 'translation-api-key-test'

SRC_LANG = "en"
DEST_LANGS = ["es","fr","ru","vi","lzh","nl","kk","de"]
OVERRIDE_OLD = False # will basically recreate all the translation files
###############
# End Config
###############

# get API key from KV using user creds
az_credential = DefaultAzureCredential()
kv = SecretClient(vault_url=f'https://{KV_NAME}.vault.azure.net',credential=az_credential)
API_KEY = kv.get_secret(SECRET_NAME).value
print(f'Translator API Key: {API_KEY}')


# use api key for translator client
credential = AzureKeyCredential(API_KEY)
text_translator = TextTranslationClient(credential = credential, region="southcentralus")

TRANS_CNT = 0


def main():
    for lang in DEST_LANGS:
        translate_language_file(SRC_LANG,lang)


def translate_language_file(src_lang: str,dest_lang: str):
    validate_language(src_lang)
    validate_language(dest_lang)
    src = get_lang_json(src_lang)
    dest = get_lang_json(dest_lang)
    
    for section in src.keys():
        if section not in dest.keys():
            dest[section] = {}
        translate_section(src,dest,section, dest_lang)


    set_lang_json(dest_lang,dest)

        

def translate_section(src,dest,section, dest_lang: str):
    for k,v in src[section].items():
        if k not in dest[section].keys() or OVERRIDE_OLD:
            print(f'Translating: {section} - {k}')
            dest[section][k] = do_translate(src[section][k], dest_lang)
            print(f'\tResult: {dest[section][k]}')

def do_translate(text: str, dest_lang: str):
    global TRANS_CNT
    ans = text_translator.translate(
        body=[InputTextItem(text=text)],
        from_language=SRC_LANG,
        to_language=[dest_lang]
    )
    TRANS_CNT += 1
    return ans[0]['translations'][0]['text']


def get_lang_json(language):
    try:
        with open(f'{language}.json','rb') as f:
            ans = f.read().decode()
        if ans:
            return json.loads(ans)
    except FileNotFoundError:
        return {}
        

def set_lang_json(language,data):
    text = json.dumps(data,indent=2,ensure_ascii=False)
    with open(f'{language}.json','w', encoding='utf-8') as f:
        f.write(text)


def validate_language(lang: str = None):
    langs = text_translator.get_supported_languages()['translation']
    
    if lang in langs.keys():
        return True
    
    print(f'Language key: {lang} is not a valid language!')
    print('Valid Languages:')
    display_lang_opts()
    raise TypeError('Language doesnt exist')

def display_lang_opts():
    langs = text_translator.get_supported_languages()
    for key, detail in langs['translation'].items():
        print(f'\t{key} - {detail["name"]}')


main()
print(f'Total Items Translated: {TRANS_CNT}')
