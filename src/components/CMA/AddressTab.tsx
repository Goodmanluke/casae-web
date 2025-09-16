interface AddressTabProps {
  address: string;
  setAddress: (address: string) => void;
  onContinue: () => void;
  onAddressChange: () => void;
}

export default function AddressTab({ address, setAddress, onContinue, onAddressChange }: AddressTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white/10 p-6 border border-white/10">
        <div className="text-xl font-semibold mb-4">Property Address</div>
        <div className="text-sm opacity-80 mb-4">
          Enter the address of the property you want to analyze.
        </div>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (address.trim()) {
              onContinue();
            }
          }}
          className="space-y-4"
        >
          <input
            className="w-full bg-white/90 text-gray-800 p-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Enter property address (e.g., 123 Main St, City, State)"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              onAddressChange();
            }}
            required
          />
          <button
            type="submit"
            disabled={!address.trim()}
            className={`w-full px-6 py-4 rounded-xl font-semibold transition ${
              address.trim()
                ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                : "bg-gray-500 cursor-not-allowed text-white"
            }`}
          >
            Continue to Condition Assessment
          </button>
        </form>
      </div>
    </div>
  );
}
