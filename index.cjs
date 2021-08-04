// Goes through all entries from the database and adds blocks to the bottom
// API currently does not allow for updating or deleting of Blocks
// To update blocks use main.sh
// To delete blocks use removepages.sh
// Sam Bagot Notion API

// USAGE node index.cjs [A] 
// [A] to do all entries else to run on selected
const dotenv = require('dotenv').config()

const fetch = require('node-fetch')

const fs = require('fs');

const { Client } = require('@notionhq/client')

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID

const HPO_array = [];

const ERRORS = [];

let errorsOnPages = []

const errorFile = 'errors.txt'

// Adapted from Aman Gupta, example pull code  
// This function RECURSIVELY pulls all the Pages from the database
async function getEntiresFromDatabase() {
    let pagecount = 0
    const entries = {};
    // recursive part checks if there are any more pages to look at
    async function getPages(cursor) {
        let request_payload = "";
        //Create the request payload based on the presense of a start_cursor
        if (cursor == undefined) {
            request_payload = {
                path: 'databases/' + databaseId + '/query',
                method: 'POST',
            }
        } else {
            request_payload = {
                path: 'databases/' + databaseId + '/query',
                method: 'POST',
                body: {
                    "start_cursor": cursor
                }
            }
        }
        //While there are more pages left in the query, get pages from the database. 
        const current_pages = await notion.request(request_payload)

        for (const page of current_pages.results) {
            let result = []

            let status = ''
            if (page.properties.Status) { status = page.properties.Status.select.name }
            // checks if a text box has been ticked and if the user wants to only update these entries

            if ((process.argv[2] != "A" && status != 'Update') || (status == 'Done')) { continue; }

            // grabs the pubmed IDs and checks for valid format
            let mids = [];
            if (page.properties["PubMed IDs"].rich_text[0]) {
                mids = page.properties["PubMed IDs"].rich_text[0].plain_text.split(';');
                for (let x in mids) {
                    if (mids[x].match(/^[0-9]+$/) != null) {
                        result[x] = mids[x];
                    } else {
                        result[x] = "Not a valid MID format";
                    }
                }
            }
            // grabs the HPO ids, splitting them on the semi colon and storing into an array
            let hpos = [];
            if (page.properties.Phenotypes.rich_text[0]) {
                hpos = page.properties.Phenotypes.rich_text[0].plain_text.split(';');
                hpos.sort();
                for (let x in hpos) {
                    let hpoID = matchHPO(hpos[x]);
                    if (HPO_array.includes(hpoID) == false) {
                        HPO_array.push(hpoID)
                    }
                }
                HPO_array.sort();
            }
            // Creats object for each page containing all information we want to extract
            entries[pagecount] = {
                "page_id": page.id,
                "mids": result,
                "hpos": hpos,
                "HGNCID": page.properties["HGNC ID"],
                "symbol": "",
                "alias": "",
                "omimG": page.properties["Gene OMIM"],
                "omimD": page.properties["Disease OMIM"],
                "wiki_pathways": page.properties.Wiki_Pathways,
                "Status": status
            }
            pagecount += 1
        }
        if (current_pages.has_more) {
            await getPages(current_pages.next_cursor)
        }

    }
    await getPages();
    return entries;
};
// creates a two part object with a title and paragraph content
function createchildblock(title, content) {
    return [{
        object: 'block',
        type: 'heading_2',
        heading_2: {
            text: [
                {
                    type: 'text',
                    text: {
                        content: title
                    }
                },
            ],
        },
    },
    {
        object: 'block',
        type: 'paragraph',
        paragraph: {
            text:
                content,
        },
    }]
}


// Creates a new text with a link
// could add error checking at the start for website validitiy???

function writetext(outurl, outcontent) {
    return {
        type: 'text',
        text: {
            content: outcontent,
            link: {
                url: outurl,
            },
        },
    }
}
//Writes a text block with no link
function writenolink(outcontent) {
    return {
        type: 'text',
        text: {
            content: outcontent,
        },
    }
}


// creates block containing LINKED OMIM, OMIM GENE, WIKI_PATHWAYS
function createLinksBlock(entry) {
    let link_block = [];
    let finalurl = "";
    let mid_line = "";
    let size = 0;
    if (typeof entry.omimG !== 'undefined') {
        if (entry.omimG.number.toString().length != 6) {
            mid_line = "Invalid omim number: " + entry.omimG.number + "\n";
            link_block[size] = writenolink(mid_line);
        } else {
            finalurl = "https://www.omim.org/entry/" + entry.omimG.number;
            let symbol = "";
            if (entry.HGNCID == undefined) {
                symbol = "No HGNC ID";
            } else {
                symbol = entry.symbol;
            }
            mid_line = "OMIM Gene ID:" + entry.omimG.number + " (" + symbol + ")\n";
            link_block[size] = writetext(finalurl, mid_line);

        }
        size += 1;
    }
    if (typeof entry.omimD !== 'undefined') {
        if (entry.omimD.number.toString().length != 6) {
            mid_line = "Invalid omim Disease number: " + entry.omimD.number + "\n";
            link_block[size] = writenolink(mid_line);
        } else {
            finalurl = "https://www.omim.org/entry/" + entry.omimD.number;
            let symbol = "";
            if (entry.HGNCID == undefined) {
                symbol = "No HGNC ID";
            } else {
                symbol = entry.symbol;
            }
            mid_line = "OMIM Disease ID:" + entry.omimD.number + "\n";
            link_block[size] = writetext(finalurl, mid_line);

        }
        size += 1;
    }
    if (entry.HGNCID !== 'undefined') {
        if (entry.symbol == "HGNC ID not found") {
            link_block[size] = writenolink(entry.symbol);
        } else if (typeof entry.HGNCID !== 'undefined') {
            finalurl = "https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:" + entry.HGNCID.number;
            mid_line = "HGNC:" + entry.HGNCID.number + " (" + entry.symbol + ")\n";
            link_block[size] = writetext(finalurl, mid_line);
        }
        size += 1;
    }
    if (size == 0) {
        link_block[0] = {
            type: 'text',
            text: {
                content: "nothing to link",
            },
        }
    }

    return createchildblock("Links", link_block);
}

// Gets the citation from PUBMED 
async function getMidLine(mid) {
    let citeurl = "https://api.ncbi.nlm.nih.gov/lit/ctxp/v1/pubmed/?format=citation&contenttype=json&id=" + mid;
    let mid_line = "";
    try {
        const response = await fetch(citeurl);
        const json = await response.json();
        if (json.ama == undefined) {
            mid_line = "0";
        } else {
            mid_line = json.ama.orig;
        }
    } catch (error) {
        ERRORS.push("Error on mid = " + mid + " " + error)
    }
    return mid_line;
}


// creates block containing LINKED MIDS from MID list 
async function createMidBlock(entry) {
    let midtext = [];
    let blockcount = 0;
    let referenceno = 0;
    for (let x in entry.mids) {
        let doi_link = "";
        let finalurl = "https://pubmed.ncbi.nlm.nih.gov/" + entry.mids[x];
        let mid_line = await getMidLine(entry.mids[x]);
        let doi_line = ""
        if (mid_line == "0") {
            mid_line = "Invalid MID: " + entry.mids[x] + "\n";
            midtext[blockcount] = writenolink(mid_line);
        } else {
            referenceno += 1;
            doi_line = mid_line.match(/doi:(.*)/);
            if (doi_line != null) {
                mid_line = mid_line.replace(/doi:.*/, "");
            }
            mid_line = referenceno + ". " + mid_line;
            midtext[blockcount] = writenolink(mid_line);
            blockcount += 1;
            if (doi_line != null) {
                doi_link = "https://doi.org/" + doi_line[1];
                let doi_outline = "doi:" + doi_line[1] + " ";
                midtext[blockcount] = writetext(doi_link, doi_outline);
                blockcount += 1;
            }
            let id_line = "[PMID:" + entry.mids[x] + "]\n\n";
            midtext[blockcount] = writetext(finalurl, id_line);
        }
        blockcount += 1;
    }
    if (midtext[0] == undefined) {
        midtext[0] = {
            type: 'text',
            text: {
                content: "No Mids",
            },
        }
    }
    return createchildblock("References", midtext);
}



/*
 *  Creates a nested table in each entry of the Dysplasia table
 *  Which then will be populated with relevant HPO information
 *  Format of the table is Name, HPO ID, Definition, 
 *  Frequency(to be manually added at a later stage) and Synonyms
 *  returns the newly created database ID
 */
async function createNestedTable(pageID) {

    let auth = "Bearer " + process.env.NOTION_API_KEY;
    let newDatabaseID = ''
    try {
        let response = await fetch('https://api.notion.com/v1/databases/', {
            method: 'POST',
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json',
                'Notion-Version': '2021-05-13'
            },
            body: JSON.stringify({
                "parent": {
                    "type": "page_id",
                    "page_id": pageID
                },
                "title":
                    [{
                        "type": "text",
                        "text": {
                            "content": "Phenotypes",
                            "url": null,
                        }
                    }
                    ],
                "properties": {
                    "Name": {
                        "title": {}
                    },
                    "HPO ID": {
                        "rich_text": {}
                    },
                    "Definition": {
                        "rich_text": {}
                    },
                    "Frequency": {
                        "type": "select",
                        "select": {
                            "options":
                                [{
                                    "name": "Common",
                                    "color": "green"
                                }, {
                                    "name": "Occasional",
                                    "color": "orange"
                                }, {
                                    "name": "Rare",
                                    "color": "red"
                                }, {
                                    "name": "ERROR INVALID FREQUENCY DETECTED",
                                    "color": "gray"
                                }, {
                                    "name": "Not Assigned",
                                    "color": "purple"
                                }
                                ]
                        }
                    },
                    "Synonyms": {
                        "rich_text": {}
                    }
                }
            })
        })
            .then(res => res.json())
            .then(json => newDatabaseID = json.id);
    } catch (error) {
        ERRORS.push("Error making nested table " + error)
        errorsOnPages.push(pageID)
    }
    return newDatabaseID
}

/**
 * matches hpo id eg HP:1234([some string]) -> HP:1234
 */
function matchHPO(fullHPO) {
    let hpoID = fullHPO.match(/HP:[0-9]+/);
    // could make this check {7}
    if (hpoID == null) {
        return null;
    }
    return hpoID[0].toString();
}

/**
 *  takes an entry in HPO_array and for each hpo ID in that entry makes an api request to HPO.jax 
 *  Pulls certain data and stored in an object array which is then returned 
 */
async function getAllHpoData() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // dirty hack but I don't have a work around
    let hpoData = {};
    let count = 0;
    for (let x in HPO_array) {
        console.log(count);
        let name = '';
        let definition = 'NA';
        let synonyms = 'NA'
        let url = 'https://hpo.jax.org/api/hpo/term/' + HPO_array[x];
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status == 404) {
                name = "**Error** no entry found in hpo.jax.org"
            } else {
                name = "Error with grabbing this entry"
            }
        } else {
            const json = await response.json();
            name = json.details.name.toUpperCase();
            definition = json.details.definition;
            synonyms = json.details.synonyms.join(', ');
        }
        hpoData[HPO_array[x]] = {
            "Name": name,
            "Definition": definition,
            "Synonyms": synonyms
        }
        count++;
    }
    return hpoData;

}

/**
 * takes a string and checks to see if it one of the acceptable formats
 * and returns the full string capitalised at the first char
 *  else it returns "ERROR INVALID FREQUENCY DETECTED"
 */
async function checkFrequencyString(input) {
    let string = input.toString().toLowerCase();
    if (string == 'rare' || string == 'r') {
        return "Rare"
    }
    if (string == 'occasional' || string == 'o') {
        return "Occasional"
    }
    if (string == 'common' || string == 'c') {
        return "Common"
    } else {
        return "ERROR INVALID FREQUENCY DETECTED"
    }
};


/**
 * takes a databaseID and an array of objects containing relevant HPO information
 *  eg, name, hpo id, definition, synonyms
 *  and creates entries to the database with it's values
 */

async function createHpoPage(newDatabaseID, entry, hpoObjectArray) {
    for (let x in entry.hpos) {
        let freq = 'Not Assigned';
        let hpoID = matchHPO(entry.hpos[x])
        let tempFreq = entry.hpos[x].match(/\((.*?)\)/);
        if (tempFreq) {
            freq = await checkFrequencyString(tempFreq[1]);
        }
        try {
            let response = await notion.pages.create({
                parent: {
                    database_id: newDatabaseID,
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: hpoObjectArray[hpoID].Name,
                                },
                            },
                        ],
                    },
                    "HPO ID": {
                        rich_text: [
                            {
                                text: {
                                    content: hpoID,
                                },
                            },
                        ],
                    },
                    Definition: {
                        rich_text: [
                            {
                                text: {
                                    content: hpoObjectArray[hpoID].Definition,
                                },
                            },
                        ],
                    },
                    Synonyms: {
                        rich_text: [
                            {
                                text: {
                                    content: hpoObjectArray[hpoID].Synonyms,
                                },
                            },
                        ],
                    },
                    Frequency: {
                        select: {
                            name: freq,
                        }
                    }
                },
            });
        } catch (error) {
            ERRORS.push("Error on Omim Number = " + JSON.stringify(entry.omimD.number) + " " + error)
            errorsOnPages.push(entry.page_id)
        }
    }
}

// Calls HGNC API to get HGNC ID and previous symbols to put into pages
async function getHGNCinfo(entry) {
    let url = "http://rest.genenames.org/fetch/hgnc_id/" + entry.HGNCID.number;
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json'
        },
    });

    let alias = "";
    if (response.status == 200) {
        const json = await response.json();
        if (json.response.numFound != 0) {
            entry.symbol = json.response.docs[0].symbol;
            for (x in json.response.docs[0].prev_symbol) {
                alias = json.response.docs[0].prev_symbol[x] + ";" + alias;
            }
            for (x in json.response.docs[0].alias_symbol) {
                alias = json.response.docs[0].alias_symbol[x] + ";" + alias;
            }
            entry.alias = alias
        } else {
            entry.symbol = "HGNC ID not found"
            ERRORS.push("Error on Omim Number = " + JSON.stringify(entries[entry].omimD.number))
        }
    } else {
        entry.symbol = "HGNC ID not found"
    }
}


// Main 'function' 
// goes through all entries from the database and adds blocks to the bottom
// API currently does not allow for updating or deleting of Blocks
// For this functionailty use removepages.py/main.sh
; (async () => {
    console.time("timer")
    const entries = await getEntiresFromDatabase();
    console.log("\nGetting Data from HPO.jax API...")
    console.log("This process can be slow. Please be patient :)")
    const hpoObjectArray = await getAllHpoData();
    console.log("Finished Getting HPO data.")

    for (let entry in entries) {
        let newDatabaseID = await createNestedTable(entries[entry].page_id);
        console.log("Making Phenotype entries for page ->" + entries[entry].page_id);
        await createHpoPage(newDatabaseID, entries[entry], hpoObjectArray, entries[entry].page_id);
        console.log("Done.")
        console.log("Getting MIDs")
        let midtext = await createMidBlock(entries[entry]);
        console.log("Creating Links Block")
        if (entries[entry].HGNCID != undefined) {
            await getHGNCinfo(entries[entry]);
        }
        let linksblock = await createLinksBlock(entries[entry]);
        console.log("Appending MID and Link Blocks")
        let response = await notion.blocks.children.append({
            block_id: entries[entry].page_id,
            children: [
                linksblock[0],
                linksblock[1],
                midtext[0],
                midtext[1],
            ],
        });
        if (entries[entry].symbol == "HGNC ID not found") { entries[entry].symbol = "" }
        try {
            response = await notion.pages.update({
                page_id: entries[entry].page_id,
                properties: {
                    'Gene Symbol': {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": entries[entry].symbol,
                                }
                            }]
                    },
                    'Previous Gene Symbols': {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": entries[entry].alias,
                                }
                            }]
                    },
                    Status: {
                        select: {
                            name: 'Done'
                        }
                    },
                },
            });
        } catch (error) {
            ERRORS.push("Error on Omim Number = " + JSON.stringify(entries[entry].omim.number) + " " + error)
            errorsOnPages.push(entries[entry].page_id)
        }
        // if error noted when sorting phenotypes (largest data set) add error flag
        for (let i in errorsOnPages) {
            try {
                response = await notion.pages.update({
                    page_id: errorsOnPages[i],
                    properties: {
                        Status: {
                            select: {
                                name: 'Error'
                            }
                        }
                    }
                })
            } catch (error) {
                console.log(error)
                ERRORS.push(error)
            }
        }
        errorsOnPages = [];
    }
    // print to error file
    if (ERRORS.length != 0) {
        var file = fs.createWriteStream(errorFile);
        file.on('error', function (err) { /* error handling */ });
        for (let i in ERRORS) {
            file.write(ERRORS[i] + ',\n');
        }
        file.end();
        console.log("Check errors in errors.txt")
    }
    console.timeEnd("timer")
})().catch(e => { console.error(e) })

