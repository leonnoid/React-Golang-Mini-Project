const base_url = "http://localhost:8080"

const apiService = {
    get: async(url: string) => {
        try{
            const response = await fetch(`${base_url}${url}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if(!response.ok) throw new Error('failed to fetch');
            return await response.json();
        }
        catch (error){
            console.error('GET request error:', error);
            throw error;
        }
    },
    post: async(url: string, data: any) => {
        try{
            const response = await fetch(`${base_url}${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });
            if(!response.ok) throw new Error('failed to post');
            return await response.json();
        } catch (error){
            console.error('POST  request error:', error);
            throw error;
        }
    },
    put: async(url: string, data: any) => {
        try{
            const response = await fetch(`${base_url}${url}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(data),
            });
            if(!response.ok) throw new Error('failed to update');
            return await response.json();
        } catch (error){
            console.error('PUT  request error:', error);
            throw error;
        }
    },
    delete: async(url: string) => {
        try{
            const response = await fetch(`${base_url}${url}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if(!response.ok) throw new Error('failed to delete');
            return await response.json();
        } catch (error){
            console.error('DELETE  request error:', error);
            throw error;
        }
    },

}
export default apiService;