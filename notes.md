# autoshop_website
## Searchable fields
Make (manufacturer) 
Year
Model (application, to which cars it applies to)
Engine
Product/Category (Description in excel sheet)
OE #
Frey #
Cross ref # (interchangable parts)

parts
id auto_increment pk | OE # | frey # | make | part | enabled | in_stock

interchangable (directional) (for every entry need 2, a_b, b_a) (b is a sub of a)
id auto_increment pk | part_a | part_b


year_model_connect  (searched model/year)
id auto_increment pk | model | begin_year | end_year | foreign key part_id
1 | 325CI | 03 | 06 | 1
2 | 325i | 03 | 05 | 1
3 | 325Xi | 03 | 05 | 1

search for model:
select part_id from year_model_connect where model equals *model*
search for year:
select part_id from year_model_connect where *year* between begin_year and end_year

```
CREATE TABLE "year_model_connect" (
	"id"	INTEGER NOT NULL UNIQUE,
	"model"	TEXT NOT NULL,
	"begin_year"	INTEGER NOT NULL,
	"end_year"	INTEGER NOT NULL,
	"parts_id"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("parts_id") REFERENCES parts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
```

engine_connect
id a_i pk | engine_size | model_id
```
CREATE TABLE "engine_connect" (
    "id" INTEGER NOT NULL UNIQUE,
    "engine_size" TEXT NOT NULL,
    "model_id" INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("model_id") REFERENCES year_model_connect(id) ON UPDATE CASCADE ON DELETE CASCADE
)


API ROUTES
GET /search


Working hours:
11/25/2020 6:00-8:00
11/27/2020 5:00-8:30
11/28/2020 7:00-10:00
11/29/2020 9:00-11:00
11/30/2020 7:30-11:00