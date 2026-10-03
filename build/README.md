# build/

`build-corpus.py` construit `data/corpus.json` : toutes les fiches de tous les
numeros, enrichies de mots-cles de recherche en francais generes par le modele
local tournant sur evo-x2 (LM Studio, API OpenAI sur `localhost:1234`).

    python build\build-corpus.py

Les mots-cles deja calcules sont gardes dans `build/keywords-cache.json` :
une relance ne regenere que les fiches nouvelles. A lancer apres chaque numero,
avant le commit.

Modele par defaut : `openai/gpt-oss-120b`. Pour en changer :
`set SS_MODEL=qwen/qwen3.6-35b-a3b` avant la commande.
