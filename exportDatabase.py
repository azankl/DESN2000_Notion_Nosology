"""
Created: 20/07/2021
Author: Michael de Francesco

A python file that takes in the .csv database exported
from Notion, and creates a separate .csv file which is
DDG2P compatible.

Notes:
- If the names of the columns change AT ALL, the program will NOT work (the fieldnames list must be updated accordingly on line 37)
"""

import csv
import sys
import re

length = len(sys.argv)
if (length <= 2):
    raise Exception('Please ensure input is $python3 exportDatabase.py <csv-filename>')

if (not sys.argv[length - 1].endswith('.csv')):
    raise Exception('Please make sure the file is a CSV file AND ends with <.csv>')

# Creating input and output strings
inputStr = ''
outPutstr = ''
for x in sys.argv:
    if (x == 'exportDatabase.py'):
        continue
    if (x.endswith('.csv')):
        inputStr += x
        outPutstr += '(G2P Compatible).csv'
    else:
        inputStr += x + ' '
        outPutstr += x + ' '

fieldnames = ['Disease Name', 'Allelic Requirement', 'DDD Category',\
'Gene OMIM', 'Gene Symbol', 'HGNC ID', 'Mutation Consequence', 
'Disease OMIM', 'Organ Specificity List', 'Panel', 'Phenotypes', \
'Previous Gene Symbols', 'PubMed IDs']
database = []
with open(inputStr, newline='') as csvfile1:
    reader = csv.DictReader(csvfile1)

    # Copying the database into a list of dictionaries
    for row in reader:
        entry = row.copy()

        # Stripping the brackets off of the HPOs
        entry['Phenotypes'] = entry['Phenotypes'].replace("(", "<")
        entry['Phenotypes'] = entry['Phenotypes'].replace(")", ">")
        entry['Phenotypes'] = re.sub('<.*?>', '', entry['Phenotypes'])

        entry['Disease Name'] = entry.pop('ï»¿Disease Name') # Weird bug with the .csv file when its exported from Notion.

        # Removing unnecessary columns from the exported file
        deletedItems = []
        for key in entry:
            if (key not in fieldnames):
                deletedItems.append(key)
        for i in deletedItems:
            del entry[i]

        database.append(entry)

# Writing into the new csv file
with open(outPutstr, 'w', newline='') as csvfile2:
    writer = csv.DictWriter(csvfile2, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(database)