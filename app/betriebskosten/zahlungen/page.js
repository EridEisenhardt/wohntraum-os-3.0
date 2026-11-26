'use client'
import { useEffect } from 'react'
/* Die Übersicht „Zahlungen & Mahnungen“ ist jetzt eine Kachel in der Betriebskostenabrechnung */
export default function Page(){
  useEffect(()=>{ window.location.replace('/betriebskosten') },[])
  return null
}
