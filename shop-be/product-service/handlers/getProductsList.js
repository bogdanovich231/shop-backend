const products = [
  { id: "1", name: "Clean Code", price: 1250 },
  { id: "2", name: "The Mythical Man-month", price: 809 },
  { id: "3", name: "The Pragmatic Programmer", price: 570 },
  { id: "4", name: " Code Complete", price: 230 },
  { id: "5", name: "The Art of Computer Programming", price: 1002 },
  { id: "6", name: "Programming Pearls", price: 753 },
];

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET",
};

async function getProductsList(event) {
    console.log('event logs: ', event)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(products),
  };
};

module.exports = { getProductsList };
