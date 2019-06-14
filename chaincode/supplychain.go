package main

//importing packages

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	// contains the definition for chaincode interface and chaincode stub
	"github.com/hyperledger/fabric/core/chaincode/shim"
	// contains the peer protobuf package
	sc "github.com/hyperledger/fabric/protos/peer"
)

type SmartContract struct {
}

// defining asset (product) attributes
type Product struct {
	Id string `json:"id"`
	NextId string `json:"nextid"`
	Type   string `json:"type"`
	Name  string `json:"name"`
	Quantity string `json:"quantity"`
	Owner  string `json:"owner"`
	CurrentOwner string `json:"currentowner"`
	Location string `json:"location"`
}

func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	// called when chaincode receives instantiate transaction, initializing application state
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()
	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "queryProduct" {
		return s.queryProduct(APIstub, args)
	} else if function == "initLedger" {
		return s.initLedger(APIstub)
	} else if function == "createProduct" {
		return s.createProduct(APIstub, args)
	} else if function == "queryAllProducts" {
		return s.queryAllProducts(APIstub)
	} else if function=="queryByOwner" {
		return s.queryByOwner(APIstub,args)
	} else if function=="transferProduct" {
		return s.transferProduct(APIstub,args)
	} else if function=="getHistoryByKey" {
		return s.getHistoryByKey(APIstub,args)
	}
	return shim.Error("Invalid Smart Contract function name.")
}


/****************************************INITIALIZE LEDGER****************************************/

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	// called during network setup to add first entry; for storing and retrieving the last id entered (to counter the unavailability of autoincrement option)

	id := "0"
	product := Product{Id: "0", NextId: "", Type: "", Name: "1", Quantity: "", Owner: "", CurrentOwner: "", Location: ""}
	productAsBytes, _ := json.Marshal(product);
	APIstub.PutState(id,productAsBytes)

	return shim.Success(nil)
}

/****************************************QUERY PRODUCT****************************************/

func (s *SmartContract) queryProduct(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	// returns the id of the new last product in the database; expects only productId as argument

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	productAsBytes, _ := APIstub.GetState(args[0])
	Product := Product{}
	err := json.Unmarshal(productAsBytes, &Product)
	if err != nil {
		return shim.Error(err.Error())
	}
	Pid := Product.Name
	currId,_ := strconv.Atoi(Pid)
	currId--
	prevId := strconv.Itoa(currId)
	var buffer bytes.Buffer
	buffer.WriteString(prevId)

	return shim.Success(buffer.Bytes())
}

/****************************************CREATE PRODUCT****************************************/

func (s *SmartContract) createProduct(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	//adds a new product to the database; expects 6 arguments

	if len(args) != 6 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	id := "0"

	lastProductAsBytes, _ := APIstub.GetState(id)
	lastProduct := Product{}
	err := json.Unmarshal(lastProductAsBytes, &lastProduct)
	lastPid := lastProduct.Name

	var product = Product{Id: lastPid, NextId: id, Type: args[0], Name: args[1], Quantity: args[2], Owner: args[3], CurrentOwner: args[4], Location: args[5]}

	productAsBytes, _ := json.Marshal(product)
	// entering new product to the ledger using putstate method
	APIstub.PutState(lastPid, productAsBytes)

	// creates a composite key using product id and owner name
	indexName := "owner~id"
	ownerIdIndexKey, err := APIstub.CreateCompositeKey(indexName, []string{product.CurrentOwner, product.Id})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := []byte{0x00}
	// entering the composite key to the ledger using putstate method
	APIstub.PutState(ownerIdIndexKey, value)

	nextId,_ := strconv.Atoi(lastPid)
	nextId++
	newId := strconv.Itoa(nextId)
	lastProduct.Name = newId
	newProductAsBytes, _ := json.Marshal(lastProduct)
	APIstub.PutState(id,newProductAsBytes)

	return shim.Success(nil)
}

/****************************************QUERY ALL PRODUCTS****************************************/

func (s *SmartContract) queryAllProducts(APIstub shim.ChaincodeStubInterface) sc.Response {
	//returns all entries in the database

	startKey := "1"
	endKey := "999"

	// gets the details of all products in a range of key values using GetStateByRange method defined in shim package
	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer

	for resultsIterator.HasNext() {
		//each record is retived to queryResponse
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		p := Product{}
		//queryResponse is a Key-Value pair; Key is the productId and Value is a JSON array
		err = json.Unmarshal(queryResponse.Value, &p)
		if err != nil {
			return shim.Error(err.Error())
		}
		thisId := p.Id
		thisType := p.Type
		thisName := p.Name
		thisQuantity := p.Quantity
		thisOwner := p.Owner
		thisCurrentOwner := p.CurrentOwner
		thisLocation := p.Location

		buffer.WriteString(string(thisId))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisType))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisName))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisQuantity))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisOwner))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisCurrentOwner))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisLocation))
		buffer.WriteString(" ")
		buffer.WriteString(".")
	}

	return shim.Success(buffer.Bytes())
}

/****************************************QUERY PRODUCT BY OWNER****************************************/

func (s *SmartContract) queryByOwner(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	// returns products grouped by its current owner or actual owner
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	// GetStateByPartialCompositeKey returns an iterator over all composite keys whose prefix matches the given partial composite key
	ownerResultsIterator, err := APIstub.GetStateByPartialCompositeKey("owner~id", []string{args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer ownerResultsIterator.Close()

	var buffer bytes.Buffer
	count := 1

	for ownerResultsIterator.HasNext() {
		responseRange, err := ownerResultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		// splits the ComposieKey into attributes from which key was formed
		_, compositeKeyParts, err := APIstub.SplitCompositeKey(responseRange.Key)
		if err != nil {
			return shim.Error(err.Error())
		}

		returnedId := compositeKeyParts[1]
		thisProductAsBytes, err := APIstub.GetState(returnedId)

		thisProduct := Product{}
		err = json.Unmarshal(thisProductAsBytes, &thisProduct)
		if err != nil {
			return shim.Error(err.Error())
		}
		thisId := thisProduct.Id
		thisType := thisProduct.Type
		thisName := thisProduct.Name
		thisQuantity := thisProduct.Quantity
		thisOwner := thisProduct.Owner
		thisCurrentOwner := thisProduct.CurrentOwner
		thisLocation := thisProduct.Location

		buffer.WriteString(strconv.Itoa(count))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisId))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisType))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisName))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisQuantity))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisOwner))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisCurrentOwner))
		buffer.WriteString(" ")
		buffer.WriteString(string(thisLocation))
		buffer.WriteString(" ")
		buffer.WriteString(".")
		count++
	}

	return shim.Success(buffer.Bytes())
}

/****************************************TRANSFER PRODUCT****************************************/

func (s *SmartContract) transferProduct(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	// to transfer product from one user to another
	// expects 4 arguments product id,transfer quantity,new owner and new location
	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	productId := args[0]
  transferQuantity,_ := strconv.Atoi(args[1])
	newOwner := args[2]
	newLoc := args[3]

	ProductAsBytes, _ := APIstub.GetState(productId)
	transferProd := Product{}
	err := json.Unmarshal(ProductAsBytes, &transferProd)
	if err != nil {
		return shim.Error(err.Error())
  }

	currQuantity,_ := strconv.Atoi(transferProd.Quantity)

	// perform math checks to ensure that transfer quantity is less than total quantity and update the ledger with new data
	if currQuantity >=transferQuantity {
		currType := transferProd.Type
		currName := transferProd.Name
		orgOwner := transferProd.Owner

		lastProductAsBytes, _ := APIstub.GetState("0")
		lastProduct := Product{}
		err = json.Unmarshal(lastProductAsBytes, &lastProduct)
		transferProd.NextId = lastProduct.Name

		newQuantity := strconv.Itoa(currQuantity-transferQuantity)
		transferProd.Quantity = newQuantity

		newProductAsBytes, _ := json.Marshal(transferProd)
		err = APIstub.PutState(productId,newProductAsBytes)

		if err != nil {
			return shim.Error(err.Error())
		}

		// invokes CreateProduct method to add the product with changed owner into the database
		response := s.createProduct(APIstub, []string{currType,currName,args[1],orgOwner,newOwner,newLoc})

		if response.Status != shim.OK {
				return shim.Error("Transfer failed: " + response.Message)
		}

		return shim.Success(nil)

	} else {
		return shim.Error("Transfer failed: transferQuantity not present")
	}

}

/****************************************GET PRODUCT HISTORY****************************************/

func (s *SmartContract) getHistoryByKey(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
	// returns list of historical states; expects single argument - prodcutId

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	historyIer, err := APIstub.GetHistoryForKey(args[0])
	var b bytes.Buffer

	if err != nil {
    return shim.Error(err.Error())
	}

	for historyIer.HasNext() {
		modification, err := historyIer.Next()
		if err != nil {
		    return shim.Error(err.Error())
		}

		p := Product{}
		err = json.Unmarshal(modification.Value,&p)
		if err != nil {
			return shim.Error(err.Error())
		}

		b.WriteString(string(p.Id))
		b.WriteString(" ")
		b.WriteString(string(p.CurrentOwner))
		b.WriteString(" ")
		b.WriteString(string(p.Quantity))
		b.WriteString(" ")
		b.WriteString(string(p.Location))
		b.WriteString("/")

		prev := p.NextId
		if prev != "0" {
			response := s.getHistoryByKey(APIstub,[]string{prev})
			if response.Status != shim.OK {
					return shim.Error("Transfer failed: " + response.Message)
			}
			b.WriteString(string(response.Payload))
		}

	}

	return shim.Success(b.Bytes())
}


/****************************************MAIN FUNCTION****************************************/

func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
