# DESN2000: Skeletal Dysplasia Knowledge Base (SDKB) Project

The goal of this project is to create a knowledge base in Notion that collects key information on all known skeletal dysplasias. 
Data from the SDKB will be shared with the G2P Project, but includes a few additional fields.
We will extract data relevant to skeletal dysplasias from the G2P Project's DDG2P data file and use this to initially populate the SDKB. 
Data from the SKDB will also be exported as a 'Skeletal G2P data file' for use with the G2P Project. 
We will use the recently released Notion API to facilitate the import and export of data.
Some features (specifically: deleting an existing block in Notion) is not yet supported in the Notion API, we thus use the inofficial Notion API for this.


View the Notion Database [here](https://www.notion.so/2360d5674740442d98435027aefe48d9?v=cec5e58748e2445581a56cc8b12fc5e5).

## Setup

### System Requirements

Python 3.5 or later (needed for the inofficial Notion API, which runs on Python) - [Download here](https://www.python.org/downloads/)  
Node 14.17.3 & npm 6.14.13 or later (needed for the official Notion API, which runs on Javascript) - [Download here](https://nodejs.org/en/download/)

### Notion API Setup

To run the Notion API script you will need to have [node](https://nodejs.org/en/download/) and npm installed.  

Once you have downloaded and installed [node](https://nodejs.org/en/download/) run:

<code>npm install</code>  
<code>npm install fetch</code>  
<code>npm install dotenv</code> 

You should now be able to run Offical Notion API scripts. 

##### Other Packages Installed
- [fetch](https://www.npmjs.com/package/node-fetch): Instead of implementing XMLHttpRequest
- [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from a .env

### Unoffical API Setup
Once you have [python3.5](https://www.python.org/downloads/) or later run:

<code>pip install notion</code>

If this fails because pip is not installed click [here](https://pip.pypa.io/en/stable/installation/).

You should now be able to run Unoffical Notion API scripts.

## Updating the Database

To update the database:

The program <code>main.sh</code> can be used to perform updates on the database.

#### Usage:

<code>./main.sh [options]</code>

##### Default:

- Removes and replaces all blocks on rows with the update property checkbox selected.

##### Options: 

&nbsp;&nbsp;&nbsp;&nbsp;**A**
-  ignores checkbox requirements and updates all pages in the database.  
-  **WARNING** - Only run this during off peak hours (11am - 7pm EST) check [Pubmed API usage guidelines](https://www.ncbi.nlm.nih.gov/books/NBK25497/#chapter2.Usage_Guidelines_and_Requiremen) for futher details. 

&nbsp;&nbsp;&nbsp;&nbsp;**C**
-  only creates blocks inside pages.  
-  runs index.cjs

&nbsp;&nbsp;&nbsp;&nbsp;**R**
-  only removes blocks inside pages.  
-  runs removepages.py

&nbsp;&nbsp;&nbsp;&nbsp;**O**
-  prints the above options

Note: when both ***R*** and ***C*** are selected this is the same as running the program on default.

<strong>Examples:</strong>

Update selected entries in the database.
```
./main.sh
```

Update every entry in the database.
```
./main.sh A
```

Remove blocks on every entry in the database.
```
./main.sh A R
    OR
./main.sh R A
```

Create blocks on selected entries in the database.
```
./main.sh C
```


## Exporting the Database

To export the database:
<ol>
<li>Go to the Notion database.</li>
<li>Click the three dots on the top right corner of the page.</li>
<li>Select export.</li>
<li>Using the option <strong>Markdown & CSV</strong>, ENSURE <strong>Include content</strong> is set to <strong>Everything</strong> AND <strong>Include subpages</strong> is turned off.</li>
<li>Click the blue Export button.</li>
<li>Save the zipped file and extract the CSV file to this directory.</li>
<li>To create the G2P compatible file, usage is <code>$ python3 exportDatabase.py 'filename'</code> <br>e.g. <code>$ python3 exportDatabase.py Skeletal Dysplasia Knowledge Base 2360d5674740442d98435027aefe48d9.csv</code></li>
</ol>
After these steps have been followed, a new file created will be called <strong>'filename' (G2P Compatible).csv</strong>, and will be in this directory. e.g <strong>Skeletal Dysplasia Knowledge Base (G2P compatible).csv</strong>

## Troubleshooting

Ensure environmental variables <code>NOTION_KEY</code> and <code>NOTION_DATABASE_ID</code> in <code>.env</code> are set correctly.

For guides one how to obtain these and any other Notion API related issues use the [Notion API Setup](https://developers.notion.com/docs).

Also ensure that you have the correct <code>token_v2</code> in the file <code>removepages.py</code> from a page **member** _not a guest_.  
In google chrome this can be obtained by:

- Accessing the database logged in as an **Admin** or **Member**.
- Right click the page. 
- Select **inspect/inspect element**.
- From the menu containg Elements, Consoles etc. select **Application**.
- Under storage select **Cookies**.
- Find the **token_v2** and check it is correct/replace it.

Ensure that the page containing the database is favourited by the same person who supplied the <code>token_v2</code>, otherwise the unofficial API will not work.

Look here for any additional help with the [Unoffical API](https://github.com/jamalex/notion-py)

#### Additional API resources

- [hpo.jax](https://hpo.jax.org/app/): Human Phenotype Ontology database API used to populate subpages.  
- [PubMed Central (PMC) APIs](https://www.ncbi.nlm.nih.gov/pmc/tools/developers/): NCIB Pubmed database used to create citations for PubMedIDs. 
- [HGNC API](https://www.genenames.org/help/rest/): HUGO Gene Nomenclature Committee used to update previous and current symbols from HGNC ID

