// Artist IDs
const ARTIST_IDS = ["00qvWOgeQtQf4XcxJM6DzU","4ByXb0waTbnoUu4EaPPD2W","00yTD0tYQNrivASVQgBGes","1KJc2XcGCkzZypmNDhIMeR","5d8GtQxBbULssUMeaHpTJ4","357zDmhgGTYSyYTyBTD65t","5P1RyLkpa2GMDium23Ptn6","2McwFGt12uHTCNmI7VhC2K","3lQpO3wZJRN29Ijr8fpwaN","1lw523m68IbWJqOXAW1dp6","6kWh8CBUb92RPXrCMzJ2og","5AzDNSnXecyb5n2SGEk210","6nCQ2Jjeut72ninwDgB6Yy","2Ar9N9Kr5qNvDq188I0DsC","6IsY6SBSPEQFRDZYzsF2nS","0OXYrzdbgxer5KtxSTuUDy","79A1B10WsQEm7MiRCHC9Fa","37rDPPf5ljzqE4MTvC1PyH","6CNN1uNMESxlBFkAlPLFGC","4d3WwgfETgTvddopuSfQ8i","2tKuJrJLd6BARL1GVE3VVT","61Qha9Ylp3V6dDX8Jj5Z1z","7dcX4psw7M8J5l1c5jRmX3","4cGEMRW0A7PAZcovV3S8KT","7sWJR3GtdK9Jr09w5Nh16B"];

document.addEventListener('DOMContentLoaded', loadStreams);

async function loadStreams(){
  const tbody = document.querySelector('#streams-table tbody');
  tbody.innerHTML = 'Laden...';

  // Client Credentials flow requires backend; fallback to fetch each artist page via open API with workaround - here we just show placeholder
  try{
    const chunks = [];
    for(const id of ARTIST_IDS){
      const res = await fetch(`https://api.spotify.com/v1/artists/${id}`);
      if(res.status===401){
        tbody.innerHTML = '<tr><td colspan="3">Deze eenvoudige demo werkt alleen met een geldig Spotify bearer-token in de browser.</td></tr>';
        return;
      }
      const a = await res.json();
      chunks.push(`<tr><td>${a.name}</td><td>${a.followers.total.toLocaleString()}</td><td>${a.popularity}</td></tr>`);
    }
    tbody.innerHTML = chunks.join('');
  }catch(e){
    tbody.innerHTML = '<tr><td colspan="3">Fout bij laden.</td></tr>';
  }
}
