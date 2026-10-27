import { supabase } from '@/lib/supabase'
import { borrarTaskService, crearTareaService, editarTaskService, getTareasService } from '@/services/crud'
import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'

const TaskScreen = () => {

    const [title, setTitle] = useState('')
    const [list, setList] = useState<any[]>([])
    const [user_id, setUserId]=useState<string|undefined>('')


    useEffect(()=>{
        async function getTareas(){
            const respuesta = await supabase.auth.getUser()
            setUserId(respuesta.data.user?.id)
            const data = await getTareasService()
            setList(data)
        }
        getTareas()
    },[list])

    return (
        <View>
            <Text>Tareas</Text>
            <TextInput
                placeholder='titulo de la tarea'
                onChangeText={setTitle}
            />
            <Pressable 
                onPress={()=>crearTareaService(title, false, user_id)}
                style={{backgroundColor:'#AEAC78'}}>
                <Text>Crear</Text>
            </Pressable>

            <FlatList
                data={list}
                keyExtractor={(item)=>item.id}
                renderItem={({item})=><Pressable 
                                        onPress={()=>{editarTaskService(item.id, !item.finish)}}
                                        onLongPress={()=>{borrarTaskService(item.id)}}
                                        style={{padding:8, marginBottom:16, backgroundColor:item.finish?'#AEAC78':'#FCF0DA'}}>
                    <Text>{item.title}</Text>
                </Pressable>}
                ListEmptyComponent={()=><Text>Sin Tareas</Text>}
            />

        </View>
    )
}

export default TaskScreen