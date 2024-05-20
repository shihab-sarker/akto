import React, { useEffect, useState } from 'react'
import transform from '../../transform';
import apiChangesData from '../data/apiChanges';
import Store from '../../../../store';
import PersistStore from '../../../../../main/PersistStore';
import func from '@/util/func';
import tableFunc from '../../../../components/tables/transform';
import api from '../../api';
import GithubServerTable from '../../../../components/tables/GithubServerTable';
import { IndexFiltersMode } from '@shopify/polaris';

function ApiChangesTable(props) {

  const { handleRowClick, tableLoading, startTimeStamp, endTimeStamp, newEndpoints, parametersCount, tab } = props ;
  const [selectedTab, setSelectedTab] = useState("endpoints") ;
  const [selected, setSelected] = useState(0) ;
  const dataTypeNames = Store(state => state.dataTypeNames);
  const apiCollectionMap = PersistStore(state => state.collectionsMap)
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState([])

  useEffect(() => {
    if (tab==1) {
      setSelected(1);
      setSelectedTab('param')
    }
    else if (tab==0) {
      setSelected(0);
      setSelectedTab('endpoints')
    }

  }, [tab]);



  const tableTabs = [
    {
      content: 'New endpoints',
      index: 0,
      badge: transform.formatNumberWithCommas(newEndpoints.length),
      onAction: ()=> {setSelectedTab('endpoints')},
      id: 'endpoints',
    },
    {
      content: 'New parameters',
      index: 1,
      badge: transform.formatNumberWithCommas(parametersCount),
      onAction: ()=> {setSelectedTab('param')},
      id: 'param',
    },
  ]

  const tableDataObj = apiChangesData.getData(selectedTab);

  const handleRow = (data) => {
      let headers = []
      if(selectedTab === 'param'){
        headers = transform.getParamHeaders() ;
      }else{
        headers = transform.getDetailsHeaders() ;
      }
      handleRowClick(data,headers)
  }

  const paramFilters = apiChangesData.getParamFilters() ;
  paramFilters[0].choices = [];
  Object.keys(apiCollectionMap).forEach((key) => {
      paramFilters[0].choices.push({
          label: apiCollectionMap[key],
          value: Number(key)
      })
  });

  paramFilters[2].choices = dataTypeNames.map((x) => {
      return {
          label:x,
          value:x
      }
  })

  function disambiguateLabel(key, value) {
    if(selectedTab === 'param'){
      switch (key) {
          case "apiCollectionId": 
              return func.convertToDisambiguateLabelObj(value, apiCollectionMap, 3)
          default:
              return value;
      }
    }else{
      return func.convertToDisambiguateLabelObj(value, null, 2);
    }
  }

  const handleSelectedTab = (selectedIndex) => {
    setLoading(true)
    setSelected(selectedIndex)
    setTimeout(()=>{
        setLoading(false)
    },200)
  }

  const fetchTableData = async(sortKey, sortOrder, skip, limit, filters, filterOperators, queryValue) =>{ 
    if(selectedTab === 'param'){
      setLoading(true);
        let ret = [];
        let total = 0;
        await api.fetchChanges(sortKey, sortOrder, skip, limit, filters, filterOperators, startTimeStamp, endTimeStamp, false, false, queryValue).then((res) => {
            ret = res.endpoints.map((x,index) => transform.prepareEndpointForTable(x,index));
            total = res.total;
            setLoading(false);
        })
        return { value: ret, total: total };
    }else{
      const dataObj = {
        "headers": tableDataObj.headers,
        "data": newEndpoints,
        "sortOptions": tableDataObj.sortOptions,
      }
      return tableFunc.fetchDataSync(sortKey, sortOrder, skip, limit, filters, filterOperators, queryValue, setFilters, dataObj)
    }
  }
  const key = selectedTab + startTimeStamp + endTimeStamp + newEndpoints.length ;

  return (
    <GithubServerTable 
      key={key}
      pageLimit={50}
      headers={tableDataObj.headers}
      resourceName={tableDataObj.resourceName}
      sortOptions={tableDataObj.sortOptions}
      disambiguateLabel={disambiguateLabel}
      loading={loading || tableLoading}
      onRowClick={(data) => handleRow(data)}
      fetchData={fetchTableData}
      filters={selectedTab === 'param' ? paramFilters : filters}
      selected={selected}
      onSelect={handleSelectedTab}
      mode={IndexFiltersMode.Default}
      headings={tableDataObj.headers}
      useNewRow={true}
      condensedHeight={true}
      tableTabs={tableTabs}
    />
  )
}

export default ApiChangesTable