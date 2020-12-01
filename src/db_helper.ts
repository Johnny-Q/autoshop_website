const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true // so we can avoid sqlite specific bugs
});
function DBtoCSV() {
    console.log("asdf");
}

/**
 * 
 * @param {string} make the make of the part, null if match all
 * @param {string} model the model of the part, null if match all
 * @param {number} year the year of the part, null if match all
 * @description searches database for all parts with applications matching query parameters
 * @return {Promise} Promise which resolves to array of PartInterface which match query parameters
 */
async function getParts(make: string, model: string, year: number): Promise<Array<PartDBEntry>> {
    try {
        return db.select().from('parts').whereRaw('make like IFNULL(?, make)', [make]).whereIn('id', function () {
            this.select('parts_id').from('year_model_connect').whereRaw('model like IFNULL(?, model)', [model]).whereRaw('IFNULL(?, begin_year) between begin_year and end_year', [year]);
        })
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function getPartByOEorFrey(id_number: string): Promise<Array<PartDBEntry>> {
    try{
        return db.select().from('parts').where('oe_number', id_number).orWhere('frey_number', id_number);
    } catch (err){
        console.log(err);
        throw err;
    }
}

/**
 * @param {PartDBEntry} part object of type PartDBEntry with entry data stored inside
 * @param {Array<Application>} applications array of applications of the part with entry data stored inside
 * @desc takes a part and array of applications for that part and inserts into database
 * @return {Promise<number>} the id of inserted part in database
 */
async function addPart(part: PartDBEntry, applications: Array<Application>) : Promise<number> {
    try {
        let part_id = await db('parts').insert(part, ['id']);
        applications.forEach(async (app: Application)=>{
            try{
                await db('year_model_connect').insert({...app, 'parts_id': part_id});
            }catch(err){
                console.log(err);
            }
        });
        return part_id;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function updatePart() { }

async function getByYear(query) {
    try {
        return db.select().from('parts').whereIn('id', function () {
            this.select('parts_id').from('year_model_connect').whereRaw('? between begin_year and end_year', [query]);
        })
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    DBtoCSV,
    getByYear,
    getParts,
    getPartByOEorFrey,
    addPart
}