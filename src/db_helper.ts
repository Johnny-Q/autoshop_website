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
            this.select('parts_id').from('year_model_connect').whereRaw('model like IFNULL(?, model)', [model])
            .whereRaw('IFNULL(?, begin_year) between begin_year and end_year', [year]);
        })
    } catch (err) {
        console.log(err);
        throw err;
    }
}

/**
 * 
 * @param {string} make the make of the part, null if match all
 * @param {string} model the model of the part, null if match all
 * @param {number} year the year of the part, null if match all
 * @param {string} engine the engine size, null if match all
 * @description searches database for all parts with applications matching query parameters
 * @return {Promise} Promise which resolves to array of PartInterface which match query parameters
 */
async function getPartsEngine(make: string, model: string, year: number, engine: string): Promise<Array<PartDBEntry>> {
    /* 
    select * from parts where make like 'bmw' and id in (
	select DISTINCT year_model_connect.parts_id from (year_model_connect left join engine_connect on year_model_connect.id = engine_connect.model_id) where 
		IFNULL(?, year_model_connect.begin_year) between year_model_connect.begin_year and year_model_connect.end_year and
		IFNULL(?, year_model_connect.model) like year_model_connect.model AND
		IFNULL(?, IFNULL(engine_connect.engine_size, 'null_model')) like IFNULL(engine_connect.engine_size, IFNULL(?, 'null_model'))
    )
    */
    try{
        return db.select().from('parts').whereRaw('make like IFNULL(?, make)', [make]).whereIn('id', function() {
            this.distinct('year_model_connect.parts_id').from('year_model_connect')
            .leftJoin('engine_connect', 'year_model_connect.id', 'engine_connect.model_id')
            .whereRaw('IFNULL(?, year_model_connect.begin_year) between year_model_connect.begin_year and year_model_connect.end_year', [year])
            .andWhereRaw('IFNULL(?, year_model_connect.model) like year_model_connect.model', [model])
            .andWhereRaw("IFNULL(?, IFNULL(engine_connect.engine_size, 'null_engine')) like IFNULL(engine_connect.engine_size, IFNULL(?, 'null_engine'))", [engine, engine])
        });
    } catch(err){
        console.log(err);
        throw(err);
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
 * @desc obtains an array of distinct model names from year_model_connect
 * @return {Promise<Array<string>>} a Promise of a string array
 * @todo sort returned array alphabetically but also by ascending number (aaa10 < aaa2 but aaa10 should come after aaa2)
 */
async function getModelNames(): Promise<Array<string>> {
    try{
        return db('year_model_connect').distinct('model');
    } catch(err){
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
        let part_id = (await db('parts').insert(part));
        applications.forEach(async (app: Application)=>{
            try{
                await db('year_model_connect').insert({...app, 'parts_id': part_id});
            }catch(err){
                // console.log(err);
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
    getPartsEngine,
    getModelNames,
    addPart
}