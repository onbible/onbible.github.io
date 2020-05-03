chapters = 150
list_itens = []

for i in range(0, chapters):
    file_name = 'gen_'+str(i+1)+'.mp3'
    chapters_name = 'Gênesis Capítulo '+ str(i+1)

    item = {
        "icon": "iconImage",
        "file": "db/mp3/gn/"+file_name,
        "title": chapters_name
    }
    list_itens.append(item)

print(list_itens)