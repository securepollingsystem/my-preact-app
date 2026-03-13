import { useState, useEffect } from 'preact/hooks';
import { tallyServer } from '../../urls.js';

const getSubset = async (searchText) => {
  const tallyUrl = tallyServer+`/opinions?subset=${searchText}`;
  const res = await fetch(
    tallyUrl
  ).catch((e) => {
    console.log(e);
  });
  console.log(
    "url:",
    tallyUrl
  );

  var data = [];

  try {
    if (!res || !res.ok) {
      throw new Error(`Network response was not ok.`);
    }
    data = await res.json();
  } catch(error) {
    console.log('could not try if !res.ok', error);
    if (searchText == '') {
      data = [ {id:0,opinion:'no data was returned from the server',screed_count:53} ];
    }
  }

  console.log("fetched opinions:", data.length);

  return data;
};

export function Search(props) {
  const { searchString, setSearchString, subset, setSubset, bringUpAddThisModal } = props;

  useEffect(() => {
    getSubset(searchString.toLowerCase()).then(setSubset);
  }, [searchString]); // searchString is what it watches and reloads the fetch on changes!!!!!!!

  const handleSearchChange = (e) => {
    setSearchString(e.target.value);
  };

  return (
    <div>
      <div style={{
        display: "flex"
      }}>
        <h1>Search text:</h1>
        <textarea
          value={searchString}
          onChange={handleSearchChange}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (searchString.trim() !== "" && subset.length === 0) {
                bringUpAddThisModal(searchString);
              }
            }
          }}
        />
      </div>
      {subset.length === 0 ? (
        <div
          onClick={() => bringUpAddThisModal(searchString)}
          key="compose"
          class="opinion"
        >
          click or press Enter to add {searchString} to your screed
        </div>
      ) : (
        subset.map((item) => (
          <div
            onClick={() => bringUpAddThisModal(item.opinion)}
            key={item.id}
            class="opinion"
          >
            {" "}
            <div>{item.opinion}</div>
            <div style={{ fontWeight: "bold", minWidth: "3em" }}>
              {item.screed_count}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
