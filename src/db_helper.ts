//@ts-expect-error
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
 * @param {string} engine the engine size, null if match all
 * @description searches database for all parts with applications matching query parameters
 * @return {Promise} Promise which resolves to array of PartInterface which match query parameters
 */
async function getPartsEngine(make: string, model: string, year: number, engine: string): Promise<Array<PartDBEntry>> {
    /* 
    select * from parts where make like 'bmw' and id in (
	select DISTINCT YearModel.parts_id from (YearModel left join Engines on YearModel.id = Engines.model_id) where 
		IFNULL(?, YearModel.begin_year) between YearModel.begin_year and YearModel.end_year and
		IFNULL(?, YearModel.model) like YearModel.model AND
		IFNULL(?, IFNULL(Engines.engine_size, 'null_model')) like IFNULL(Engines.engine_size, IFNULL(?, 'null_model'))
    )
    */
    try{
        // if(make) make = '%'+make+'%';
        // if(model) model = '%'+model+'%';
        // if(engine) engine = '%'+engine+'%';
        return db.select().from('Parts').leftJoin('Makes', 'Parts.make_id', 'Makes.id')
            .whereRaw('Makes.make like IFNULL(?, Makes.make)', [make]).whereIn('Parts.id', function() {
                this.distinct('YearModel.parts_id').from('YearModel')
                .leftJoin('Engines', 'YearModel.id', 'Engines.model_id')
                .leftJoin('Models', 'YearModel.model_id', 'Models.id')
                .whereRaw('YearModel.year = IFNULL(?, YearModel.year)', [year])
                .andWhereRaw('IFNULL(?, Models.model) like Models.model', [model])
                .andWhereRaw("IFNULL(?, IFNULL(Engines.engine, 'null_engine')) like IFNULL(Engines.engine, IFNULL(?, 'null_engine'))", [engine, engine])
            });
    } catch(err){
        console.log(err);
        throw(err);
    }
}

/**
 * @desc get specified number of parts with offset for pagination
 * @param {string} make the make of the part, null if match all
 * @param {string} model the model of the part, null if match all
 * @param {number} year the year of the part, null if match all
 * @param {string} engine the engine size, null if match all
 * @param {number} offset the number of parts to offset by
 * @param {number} num_results number of results to return
 */
async function paginatedSearch(make: string, model: string, year: number, engine: string, offset=0, num_results=10){
    try{
        // if(make) make = '%'+make+'%';
        // if(model) model = '%'+model+'%';
        // if(engine) engine = '%'+engine+'%';
        return db.select().from('Parts').leftJoin('Makes', 'Parts.make_id', 'Makes.id')
            .whereRaw('Makes.make like IFNULL(?, Makes.make)', [make]).whereIn('Parts.id', function() {
                this.distinct('YearModel.parts_id').from('YearModel')
                .leftJoin('Engines', 'YearModel.id', 'Engines.model_id')
                .leftJoin('Models', 'YearModel.model_id', 'Models.id')
                .whereRaw('YearModel.year = IFNULL(?, YearModel.year)', [year])
                .andWhereRaw('IFNULL(?, Models.model) like Models.model', [model])
                .andWhereRaw("IFNULL(?, IFNULL(Engines.engine, 'null_engine')) like IFNULL(Engines.engine, IFNULL(?, 'null_engine'))", [engine, engine])
            }).orderBy('Parts.id').limit(num_results).offset(offset);
    } catch(err){
        console.log(err);
        throw(err);
    }
}

async function getPartByOEorFrey(id_number: string): Promise<Array<PartDBEntry>> {
    try{
        return db.select().from('Parts').whereRaw('oe_number like ?', id_number+'%').orWhereRaw('frey_number like ?', id_number+'%');
    } catch (err){
        console.log(err);
        throw err;
    }
}

/**
 * @desc obtains an array of distinct make names from database
 * @return {Promise<Array<string>>} a Promise of a string array
 * @todo sort returned array alphabetically but also by ascending number (aaa10 < aaa2 but aaa10 should come after aaa2)
 */
async function getMakes(): Promise<Array<string>> {
    try{
        return db('Makes').distinct('make');
    } catch(err){
        console.log(err);
        throw err;
    }
}
/**
 * @desc obtains array of valid years given a make
 * @return {Promise<Array<number>>} Promise of number array containing years
 * @param {string} make the make to query valid years for, null if match all
 */
async function getYears(make: string): Promise<Array<number>> {
    try{
        let make_id = await db('Makes').select('id').where('make', make.toLowerCase());
        if(make_id.length == 0){
            make_id = await db('Makes').insert({'make': make.toLowerCase()});
        } make_id = make_id[0].id;

        return db('YearModel').distinct('year').where('make_id', make_id).orderBy('year');
    } catch(err){
        console.log(err);
        throw err;
    }
}

/**
 * @desc obtains array of valid models given a make and year
 * @return {Promise<Array<string>>} Promise of string array containing models
 * @param {string} make the make to query valid models for, null if match all
 * @param {number} year the year to query valid models for, null if match all
 */
async function getModels(make: string, year: number): Promise<Array<string>> {
    try{
        let make_id = await db('Makes').select('id').where('make', make.toLowerCase());
        if(make_id.length == 0){
            make_id = await db('Makes').insert({'make': make.toLowerCase()});
        } make_id = make_id[0].id;
        return db.distinct('model').from('YearModel').leftJoin('Models', 'Models.id', 'YearModel.model_id').where('YearModel.make_id', make_id).andWhere('year', year);
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
async function addPart(part_raw: PartDBEntry, applications: Array<Application>) : Promise<number> {
    try {
        let make_id = await db('Makes').select('id').where('make', part_raw.make.toLowerCase());
        if(make_id.length == 0){
            make_id = await db('Makes').insert({'make': part_raw.make.toLowerCase()});
        }
        else make_id = make_id[0].id;
        let brand_id = [{id: null}];
        if(part_raw.brand){
            brand_id = await db('Brands').select('id').where('brand', part_raw.brand.toLowerCase());
            if(brand_id.length == 0){
                brand_id = await db('Brands').insert({'brand': part_raw.brand.toLowerCase()});
            }
            else brand_id = brand_id[0].id;
        }
        let part = part_raw as any;
        delete part.make; part.make_id = make_id;
        delete part.brand; part.brand_id = brand_id;
        let part_id = (await db('Parts').insert(part));
        applications.forEach(async (app_raw: Application)=>{
            let model_id = await db('Models').select('id').where('model', app_raw.model.toLowerCase()).andWhere('make_id', part.make_id);
            if(model_id.length == 0){
                model_id = await db('Models').insert({
                    'model': app_raw.model.toLowerCase(),
                    'make_id': part.make_id
                });
            } else model_id = model_id[0].id;
            try{
                for(var year = app_raw.begin_year; year <= app_raw.end_year; year++){
                    //console.log(make_id, model_id, part_id, year)
                    await db('YearModel').insert({'make_id': make_id, 'model_id': model_id, 'parts_id': part_id, 'year': year});
                }
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

module.exports = {
    DBtoCSV,
    getPartByOEorFrey,
    getPartsEngine,
    getModels,
    getYears,
    getMakes,
    addPart,
    paginatedSearch
}